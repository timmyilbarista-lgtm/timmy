from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'baristashift_secret_key_2024')
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============== MODELS ==============

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin: str
    role: str = "barista"  # barista or manager
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    pin: str
    role: str = "barista"

class UserLogin(BaseModel):
    name: str
    pin: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    role: str

class CategoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: str = "clipboard"
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    icon: str = "clipboard"
    order: int = 0

class ChecklistItemBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    name: str
    description: str = ""
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChecklistItemCreate(BaseModel):
    category_id: str
    name: str
    description: str = ""
    order: int = 0

class ChecklistItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class ShiftBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    shift_type: str  # morning, afternoon, evening
    opened_by: str  # user_id
    opened_by_name: str
    closed_by: Optional[str] = None
    closed_by_name: Optional[str] = None
    status: str = "open"  # open, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

class ShiftCreate(BaseModel):
    shift_type: str

class ShiftCompletionBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shift_id: str
    item_id: str
    completed: bool = False
    completed_by: Optional[str] = None
    completed_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: str = ""

class CompleteItemRequest(BaseModel):
    item_id: str
    completed: bool
    notes: str = ""

class NoteBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shift_id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoteCreate(BaseModel):
    shift_id: str
    content: str

# ============== HELPERS ==============

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_manager(user: dict = Depends(get_current_user)):
    if user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"name": data.name}, {"_id": 0})
    if not user or not verify_pin(data.pin, user["pin"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "role": user["role"]}}

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"name": data.name})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = UserBase(
        name=data.name,
        pin=hash_pin(data.pin),
        role=data.role
    )
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "name": user.name, "role": user.role}}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "role": user["role"]}

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "pin": 0}).to_list(100)
    return users

# ============== CATEGORY ENDPOINTS ==============

@api_router.get("/categories")
async def get_categories(user: dict = Depends(get_current_user)):
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.post("/categories")
async def create_category(data: CategoryCreate, user: dict = Depends(require_manager)):
    category = CategoryBase(**data.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return {"id": category.id, "name": category.name, "icon": category.icon, "order": category.order}

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, data: CategoryCreate, user: dict = Depends(require_manager)):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {"name": data.name, "icon": data.icon, "order": data.order}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_manager)):
    await db.categories.delete_one({"id": category_id})
    await db.checklist_items.delete_many({"category_id": category_id})
    return {"success": True}

# ============== CHECKLIST ITEM ENDPOINTS ==============

@api_router.get("/checklist-items")
async def get_checklist_items(user: dict = Depends(get_current_user)):
    items = await db.checklist_items.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(500)
    return items

@api_router.get("/checklist-items/category/{category_id}")
async def get_items_by_category(category_id: str, user: dict = Depends(get_current_user)):
    items = await db.checklist_items.find(
        {"category_id": category_id, "is_active": True}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return items

@api_router.post("/checklist-items")
async def create_checklist_item(data: ChecklistItemCreate, user: dict = Depends(require_manager)):
    item = ChecklistItemBase(**data.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.checklist_items.insert_one(doc)
    return {"id": item.id, "name": item.name, "category_id": item.category_id}

@api_router.put("/checklist-items/{item_id}")
async def update_checklist_item(item_id: str, data: ChecklistItemUpdate, user: dict = Depends(require_manager)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    result = await db.checklist_items.update_one({"id": item_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}

@api_router.delete("/checklist-items/{item_id}")
async def delete_checklist_item(item_id: str, user: dict = Depends(require_manager)):
    await db.checklist_items.update_one({"id": item_id}, {"$set": {"is_active": False}})
    return {"success": True}

# ============== SHIFT ENDPOINTS ==============

@api_router.get("/shifts/current")
async def get_current_shift(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    shift = await db.shifts.find_one({"date": today, "status": "open"}, {"_id": 0})
    if not shift:
        return None
    
    # Get completions for this shift
    completions = await db.shift_completions.find(
        {"shift_id": shift["id"]}, 
        {"_id": 0}
    ).to_list(500)
    
    shift["completions"] = completions
    return shift

@api_router.post("/shifts")
async def create_shift(data: ShiftCreate, user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if open shift exists
    existing = await db.shifts.find_one({"date": today, "status": "open"})
    if existing:
        raise HTTPException(status_code=400, detail="A shift is already open for today")
    
    shift = ShiftBase(
        date=today,
        shift_type=data.shift_type,
        opened_by=user["id"],
        opened_by_name=user["name"]
    )
    doc = shift.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.shifts.insert_one(doc)
    
    # Create completion entries for all active items
    items = await db.checklist_items.find({"is_active": True}, {"_id": 0}).to_list(500)
    for item in items:
        completion = ShiftCompletionBase(shift_id=shift.id, item_id=item["id"])
        comp_doc = completion.model_dump()
        await db.shift_completions.insert_one(comp_doc)
    
    return {"id": shift.id, "date": shift.date, "shift_type": shift.shift_type, "status": shift.status}

@api_router.put("/shifts/{shift_id}/close")
async def close_shift(shift_id: str, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    result = await db.shifts.update_one(
        {"id": shift_id},
        {"$set": {
            "status": "closed",
            "closed_by": user["id"],
            "closed_by_name": user["name"],
            "closed_at": now.isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"success": True}

@api_router.put("/shifts/{shift_id}/complete-item")
async def complete_item(shift_id: str, data: CompleteItemRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    update_data = {
        "completed": data.completed,
        "notes": data.notes
    }
    if data.completed:
        update_data["completed_by"] = user["id"]
        update_data["completed_by_name"] = user["name"]
        update_data["completed_at"] = now.isoformat()
    else:
        update_data["completed_by"] = None
        update_data["completed_by_name"] = None
        update_data["completed_at"] = None
    
    result = await db.shift_completions.update_one(
        {"shift_id": shift_id, "item_id": data.item_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        # Try to create if not exists
        completion = ShiftCompletionBase(
            shift_id=shift_id,
            item_id=data.item_id,
            completed=data.completed,
            completed_by=user["id"] if data.completed else None,
            completed_by_name=user["name"] if data.completed else None,
            completed_at=now if data.completed else None,
            notes=data.notes
        )
        comp_doc = completion.model_dump()
        if comp_doc.get('completed_at'):
            comp_doc['completed_at'] = comp_doc['completed_at'].isoformat()
        await db.shift_completions.insert_one(comp_doc)
    
    return {"success": True}

@api_router.get("/shifts/history")
async def get_shift_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    
    shifts = await db.shifts.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    
    # Add completion stats
    for shift in shifts:
        completions = await db.shift_completions.find(
            {"shift_id": shift["id"]}, 
            {"_id": 0}
        ).to_list(500)
        total = len(completions)
        completed = len([c for c in completions if c.get("completed")])
        shift["total_items"] = total
        shift["completed_items"] = completed
        shift["completion_rate"] = round(completed / total * 100, 1) if total > 0 else 0
    
    return shifts

@api_router.get("/shifts/{shift_id}")
async def get_shift_detail(shift_id: str, user: dict = Depends(get_current_user)):
    shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    completions = await db.shift_completions.find(
        {"shift_id": shift_id}, 
        {"_id": 0}
    ).to_list(500)
    
    shift["completions"] = completions
    return shift

# ============== NOTES ENDPOINTS ==============

@api_router.get("/notes/shift/{shift_id}")
async def get_shift_notes(shift_id: str, user: dict = Depends(get_current_user)):
    notes = await db.notes.find({"shift_id": shift_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notes

@api_router.post("/notes")
async def create_note(data: NoteCreate, user: dict = Depends(get_current_user)):
    note = NoteBase(
        shift_id=data.shift_id,
        user_id=user["id"],
        user_name=user["name"],
        content=data.content
    )
    doc = note.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notes.insert_one(doc)
    return {"id": note.id, "content": note.content, "user_name": note.user_name}

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    await db.notes.delete_one({"id": note_id})
    return {"success": True}

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing = await db.categories.find_one()
    if existing:
        return {"message": "Data already seeded"}
    
    # Create default categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Carichi", "icon": "package", "order": 1, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Pulizia Macchina", "icon": "coffee", "order": 2, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Ordini", "icon": "clipboard-list", "order": 3, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Inventario", "icon": "boxes", "order": 4, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Cassa", "icon": "wallet", "order": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Frigoriferi", "icon": "thermometer", "order": 6, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.categories.insert_many(categories)
    
    # Create default checklist items
    items = []
    
    # Carichi
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[0]["id"], "name": "Carico latte", "description": "Verificare scorte latte fresco", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[0]["id"], "name": "Carico zucchero", "description": "Rifornire zuccheriere", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[0]["id"], "name": "Carico bicchieri", "description": "Verificare bicchieri carta e vetro", "order": 3, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Pulizia Macchina
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[1]["id"], "name": "Pulizia gruppo", "description": "Pulire gruppo erogazione", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[1]["id"], "name": "Scarico fondi", "description": "Svuotare cassetto fondi", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[1]["id"], "name": "Pulizia lancia vapore", "description": "Pulire e spurgare lancia", "order": 3, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Ordini
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[2]["id"], "name": "Verifica ordini in arrivo", "description": "Controllare consegne previste", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[2]["id"], "name": "Sistemazione merce", "description": "Riporre merce nei ripiani", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Inventario
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[3]["id"], "name": "Controllo scorte caffe", "description": "Verificare kg caffe disponibili", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[3]["id"], "name": "Controllo scorte pasticceria", "description": "Contare cornetti e dolci", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Cassa
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[4]["id"], "name": "Verifica fondo cassa", "description": "Contare contanti in cassa", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[4]["id"], "name": "Chiusura fiscale", "description": "Stampare chiusura giornaliera", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Frigoriferi
    items.extend([
        {"id": str(uuid.uuid4()), "category_id": categories[5]["id"], "name": "Temperatura frigo bar", "description": "Verificare 0-4 gradi", "order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "category_id": categories[5]["id"], "name": "Temperatura frigo dolci", "description": "Verificare temperatura vetrina", "order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    await db.checklist_items.insert_many(items)
    
    # Create default manager user
    manager = {
        "id": str(uuid.uuid4()),
        "name": "Manager",
        "pin": hash_pin("1234"),
        "role": "manager",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(manager)
    
    # Create default barista user
    barista = {
        "id": str(uuid.uuid4()),
        "name": "Barista",
        "pin": hash_pin("0000"),
        "role": "barista",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(barista)
    
    return {"message": "Data seeded successfully", "manager_pin": "1234", "barista_pin": "0000"}

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "BaristaShift API", "version": "1.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
