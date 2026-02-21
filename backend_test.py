#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class BaristaShiftAPITester:
    def __init__(self):
        self.base_url = "https://turno-control-1.preview.emergentagent.com/api"
        self.manager_token = None
        self.barista_token = None
        self.current_shift_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_seed_data(self):
        """Test seeding initial data"""
        try:
            response = requests.post(f"{self.base_url}/seed", timeout=10)
            success = response.status_code in [200, 400]  # 400 is ok if already seeded
            details = f"Status: {response.status_code}" if not success else ""
            self.log_test("Seed Data", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_login(self, name, pin, expected_role):
        """Test user login"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"name": name, "pin": pin},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                user = data.get("user", {})
                
                if token and user.get("role") == expected_role:
                    self.log_test(f"Login {name} ({expected_role})", True)
                    return token
                else:
                    self.log_test(f"Login {name} ({expected_role})", False, "Invalid token or role")
                    return None
            else:
                self.log_test(f"Login {name} ({expected_role})", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"Login {name} ({expected_role})", False, str(e))
            return None

    def test_authenticated_endpoint(self, token, endpoint, method="GET", data=None, expected_status=200, test_name=None):
        """Test authenticated endpoint"""
        if not test_name:
            test_name = f"{method} {endpoint}"
            
        try:
            headers = {"Authorization": f"Bearer {token}"}
            url = f"{self.base_url}/{endpoint}"
            
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}" if not success else ""
            
            self.log_test(test_name, success, details)
            
            if success:
                return response.json() if response.content else {}
            return None
            
        except Exception as e:
            self.log_test(test_name, False, str(e))
            return None

    def test_categories_flow(self):
        """Test categories CRUD operations"""
        if not self.manager_token:
            return False
            
        # Get categories
        categories = self.test_authenticated_endpoint(
            self.manager_token, "categories", "GET", test_name="Get Categories"
        )
        
        if categories is None:
            return False
            
        # Test category creation (manager only)
        new_category = {
            "name": "Test Category",
            "icon": "coffee",
            "order": 99
        }
        
        created = self.test_authenticated_endpoint(
            self.manager_token, "categories", "POST", new_category, 200, "Create Category"
        )
        
        if created:
            # Test category update
            updated_data = {
                "name": "Updated Test Category",
                "icon": "package",
                "order": 100
            }
            
            self.test_authenticated_endpoint(
                self.manager_token, f"categories/{created['id']}", "PUT", updated_data, 200, "Update Category"
            )
            
            # Test category deletion
            self.test_authenticated_endpoint(
                self.manager_token, f"categories/{created['id']}", "DELETE", expected_status=200, test_name="Delete Category"
            )
        
        return True

    def test_checklist_items_flow(self):
        """Test checklist items CRUD operations"""
        if not self.manager_token:
            return False
            
        # Get items
        items = self.test_authenticated_endpoint(
            self.manager_token, "checklist-items", "GET", test_name="Get Checklist Items"
        )
        
        if items is None:
            return False
            
        # Get categories to use one for item creation
        categories = self.test_authenticated_endpoint(
            self.manager_token, "categories", "GET"
        )
        
        if categories and len(categories) > 0:
            category_id = categories[0]["id"]
            
            # Create new item
            new_item = {
                "category_id": category_id,
                "name": "Test Item",
                "description": "Test item description",
                "order": 99
            }
            
            created = self.test_authenticated_endpoint(
                self.manager_token, "checklist-items", "POST", new_item, 200, "Create Checklist Item"
            )
            
            if created:
                # Update item
                updated_data = {
                    "name": "Updated Test Item",
                    "description": "Updated description"
                }
                
                self.test_authenticated_endpoint(
                    self.manager_token, f"checklist-items/{created['id']}", "PUT", updated_data, 200, "Update Checklist Item"
                )
                
                # Delete item (soft delete)
                self.test_authenticated_endpoint(
                    self.manager_token, f"checklist-items/{created['id']}", "DELETE", expected_status=200, test_name="Delete Checklist Item"
                )
        
        return True

    def test_shift_flow(self):
        """Test complete shift flow"""
        if not self.barista_token:
            return False
            
        # Check current shift
        current = self.test_authenticated_endpoint(
            self.barista_token, "shifts/current", "GET", test_name="Get Current Shift"
        )
        
        # Create new shift if none exists
        shift_data = {"shift_type": "morning"}
        created_shift = self.test_authenticated_endpoint(
            self.barista_token, "shifts", "POST", shift_data, 200, "Create Shift"
        )
        
        if created_shift:
            self.current_shift_id = created_shift["id"]
            
            # Get shift with completions
            shift_detail = self.test_authenticated_endpoint(
                self.barista_token, "shifts/current", "GET", test_name="Get Current Shift with Completions"
            )
            
            if shift_detail and shift_detail.get("completions"):
                # Test item completion
                if len(shift_detail["completions"]) > 0:
                    item_completion = {
                        "item_id": shift_detail["completions"][0]["item_id"],
                        "completed": True,
                        "notes": "Test completion note"
                    }
                    
                    self.test_authenticated_endpoint(
                        self.barista_token, f"shifts/{self.current_shift_id}/complete-item", 
                        "PUT", item_completion, 200, "Complete Checklist Item"
                    )
            
            # Test shift closure
            self.test_authenticated_endpoint(
                self.barista_token, f"shifts/{self.current_shift_id}/close", 
                "PUT", expected_status=200, test_name="Close Shift"
            )
        
        return True

    def test_notes_flow(self):
        """Test notes functionality"""
        if not self.barista_token or not self.current_shift_id:
            return False
            
        # Create a note
        note_data = {
            "shift_id": self.current_shift_id,
            "content": "Test note for next shift"
        }
        
        created_note = self.test_authenticated_endpoint(
            self.barista_token, "notes", "POST", note_data, 200, "Create Note"
        )
        
        if created_note:
            # Get shift notes
            self.test_authenticated_endpoint(
                self.barista_token, f"notes/shift/{self.current_shift_id}", "GET", test_name="Get Shift Notes"
            )
            
            # Delete note
            self.test_authenticated_endpoint(
                self.barista_token, f"notes/{created_note['id']}", "DELETE", expected_status=200, test_name="Delete Note"
            )
        
        return True

    def test_shift_history(self):
        """Test shift history functionality"""
        if not self.barista_token:
            return False
            
        # Get all shift history
        self.test_authenticated_endpoint(
            self.barista_token, "shifts/history", "GET", test_name="Get Shift History"
        )
        
        # Test with date filters
        today = datetime.now().strftime("%Y-%m-%d")
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        self.test_authenticated_endpoint(
            self.barista_token, f"shifts/history?start_date={yesterday}&end_date={today}", 
            "GET", test_name="Get Filtered Shift History"
        )
        
        return True

    def test_authorization(self):
        """Test role-based access control"""
        if not self.barista_token or not self.manager_token:
            return False
            
        # Test barista trying to access manager endpoint (should fail)
        response = requests.post(
            f"{self.base_url}/categories",
            headers={"Authorization": f"Bearer {self.barista_token}"},
            json={"name": "Unauthorized", "icon": "coffee", "order": 1},
            timeout=10
        )
        
        unauthorized_blocked = response.status_code == 403
        self.log_test("Barista Authorization Block", unauthorized_blocked, 
                     f"Expected 403, got {response.status_code}" if not unauthorized_blocked else "")
        
        return unauthorized_blocked

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting BaristaShift API Tests\n")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("\n❌ API not accessible, stopping tests")
            return False
            
        # Seed data
        self.test_seed_data()
        
        # Authentication tests
        print("\n📋 Testing Authentication...")
        self.manager_token = self.test_login("Manager", "1234", "manager")
        self.barista_token = self.test_login("Barista", "0000", "barista")
        
        if not self.manager_token or not self.barista_token:
            print("\n❌ Login failed, cannot proceed with authenticated tests")
            return False
        
        # Test user info endpoint
        self.test_authenticated_endpoint(self.manager_token, "auth/me", test_name="Get Manager Profile")
        self.test_authenticated_endpoint(self.barista_token, "auth/me", test_name="Get Barista Profile")
        
        # Authorization tests
        print("\n🔐 Testing Authorization...")
        self.test_authorization()
        
        # Categories tests
        print("\n📂 Testing Categories...")
        self.test_categories_flow()
        
        # Checklist items tests  
        print("\n📝 Testing Checklist Items...")
        self.test_checklist_items_flow()
        
        # Shift workflow tests
        print("\n⏰ Testing Shift Flow...")
        self.test_shift_flow()
        
        # Notes tests
        print("\n📝 Testing Notes...")
        self.test_notes_flow()
        
        # History tests
        print("\n📊 Testing History...")
        self.test_shift_history()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 FINAL RESULTS:")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "Success rate: 0%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️ Some tests failed - check details above")
            return False

def main():
    tester = BaristaShiftAPITester()
    success = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())