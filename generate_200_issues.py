import json
import random
from datetime import datetime, timedelta

# Load existing users
with open('src/data/users.json', 'r') as f:
    users_data = json.load(f)
    users = users_data['users']

# Load existing issues to get the current count
with open('src/data/issues.json', 'r') as f:
    issues_data = json.load(f)
    existing_issues = issues_data['issues']

print(f"Existing issues: {len(existing_issues)}")
print(f"Available users: {len(users)}")

# Issue templates with realistic descriptions
issue_templates = {
    'pothole': [
        "Large pothole causing vehicle damage on {}",
        "Deep pothole needs urgent repair at {}",
        "Multiple potholes forming on {}",
        "Dangerous pothole filled with water on {}",
        "Pothole getting bigger daily at {}",
    ],
    'garbage': [
        "Overflowing garbage bins at {}, attracting pests",
        "Garbage collection missed for 3 days at {}",
        "Illegal dumping site near {}",
        "Broken garbage bin needs replacement at {}",
        "Foul smell from uncollected garbage at {}",
    ],
    'streetlight': [
        "Street light not working on {}",
        "Multiple streetlights out on {}",
        "Street light pole damaged at {}",
        "Flickering street light needs replacement at {}",
        "Broken street light causing safety concerns at {}",
    ],
    'water_leak': [
        "Major water leak from underground pipe at {}",
        "Continuous water spillage affecting road at {}",
        "Valve leak creating puddle on {}",
        "Water pipe burst at {}",
        "Leaking fire hydrant wasting water at {}",
    ],
    'broken_sidewalk': [
        "Cracked pavement creating trip hazard on {}",
        "Sidewalk sinking at {} intersection",
        "Broken curb edge dangerous for pedestrians at {}",
        "Large hole in footpath near {}",
        "Uneven sidewalk tiles at {}",
    ],
    'traffic_signal': [
        "Traffic signal not functioning at {}",
        "Malfunctioning pedestrian signal at {}",
        "Traffic light stuck on red at {}",
        "Yellow light flickering continuously at {}",
        "Timer not working on traffic light at {}",
    ],
    'drainage': [
        "Blocked storm drain causing flooding at {}",
        "Drainage cover missing creating hazard at {}",
        "Clogged drainage pipe on {}",
        "Poor drainage causing water accumulation at {}",
        "Broken drainage grate at {}",
    ],
    'tree_maintenance': [
        "Dangerous hanging branch above {} road",
        "Overgrown tree branches blocking view at {}",
        "Dead tree needs removal at {}",
        "Tree blocking street sign at {}",
        "Tree roots damaging sidewalk at {}",
    ],
    'noise_complaint': [
        "Construction noise violating hours at {}",
        "Loud music from commercial area disturbing {} residents",
        "Industrial machinery noise at night near {}",
        "Barking dogs complaint in {} area",
        "Late night party noise at {}",
    ],
    'parking': [
        "Illegal parking blocking driveway at {}",
        "Abandoned vehicle on {} for weeks",
        "No parking zone ignored on {}",
        "Parking violations at {} daily",
        "Double parking causing traffic issues at {}",
    ]
}

# Street names for realistic locations
streets = [
    "Main Street", "Oak Avenue", "Maple Avenue", "Elm Boulevard", "Pine Road",
    "Cedar Lane", "Birch Drive", "Willow Way", "Ash Court", "Cherry Lane",
    "Walnut Avenue", "Spruce Street", "Cypress Street", "Redwood Circle",
    "Juniper Lane", "Hawthorn Way", "Sycamore Street", "Dogwood Way",
    "Magnolia Drive", "Cottonwood Road", "Beech Boulevard", "Chestnut Avenue",
    "Sequoia Avenue", "Palm Street"
]

# Status distribution (more realistic)
statuses = ['pending', 'in_progress', 'resolved']
status_weights = [0.35, 0.30, 0.35]  # 35% pending, 30% in progress, 35% resolved

# Priority distribution
priorities = ['low', 'medium', 'high']
priority_weights = [0.40, 0.40, 0.20]  # 40% low, 40% medium, 20% high

# Generate 200 new issues
new_issues = []
base_timestamp = datetime.now()

# Create some duplicate issue groups (same issue reported by different people)
duplicate_groups = []
num_duplicate_groups = 15  # 15 issues will have duplicates

for i in range(num_duplicate_groups):
    issue_type = random.choice(list(issue_templates.keys()))
    street = random.choice(streets)
    description = random.choice(issue_templates[issue_type]).format(street)
    priority = random.choices(priorities, weights=priority_weights)[0]
    
    # Generate base coordinates for this issue
    base_lat = 22.24 + random.uniform(0, 0.10)
    base_lon = 73.31 + random.uniform(0, 0.10)
    
    # Generate a unique issue ID for this group
    issue_id = f"176{random.randint(1400000000, 1700000000)}{random.choice('abcdefghijklmnopqrstuvwxyz')}{random.randint(100, 999)}"
    
    duplicate_groups.append({
        'id': issue_id,
        'type': issue_type,
        'description': description,
        'street': street,
        'priority': priority,
        'base_lat': base_lat,
        'base_lon': base_lon
    })

# Generate issues
for i in range(200):
    user = random.choice(users)
    
    # 20% chance this is a duplicate report
    if i < 40 and duplicate_groups:  # First 40 issues can be duplicates
        duplicate_group = random.choice(duplicate_groups)
        issue_id = duplicate_group['id']
        issue_type = duplicate_group['type']
        description = duplicate_group['description']
        street = duplicate_group['street']
        priority = duplicate_group['priority']
        # Slight variation in coordinates (same general area)
        latitude = duplicate_group['base_lat'] + random.uniform(-0.002, 0.002)
        longitude = duplicate_group['base_lon'] + random.uniform(-0.002, 0.002)
    else:
        # Generate unique issue
        issue_type = random.choice(list(issue_templates.keys()))
        street = random.choice(streets)
        description = random.choice(issue_templates[issue_type]).format(street)
        priority = random.choices(priorities, weights=priority_weights)[0]
        latitude = 22.24 + random.uniform(0, 0.10)
        longitude = 73.31 + random.uniform(0, 0.10)
        issue_id = f"176{random.randint(1400000000, 1700000000)}{random.choice('abcdefghijklmnopqrstuvwxyz')}{random.randint(100, 999)}"
    
    # Random date in last 60 days
    days_ago = random.randint(0, 60)
    created_at = base_timestamp - timedelta(days=days_ago)
    
    # Status and updated_at
    status = random.choices(statuses, weights=status_weights)[0]
    
    if status == 'pending':
        # Pending issues: updated recently or same as created
        update_offset = random.randint(0, 2)
        updated_at = created_at + timedelta(days=update_offset)
    elif status == 'in_progress':
        # In progress: updated 1-7 days after creation
        update_offset = random.randint(1, 7)
        updated_at = created_at + timedelta(days=update_offset)
    else:  # resolved
        # Resolved: updated 1-15 days after creation
        update_offset = random.randint(1, 15)
        updated_at = created_at + timedelta(days=update_offset)
    
    # Anonymous 30% of the time
    is_anonymous = random.random() < 0.3
    
    # Image path (some issues have images)
    image_path = None
    if random.random() < 0.40:  # 40% have images
        image_path = f"/uploads/issue_{random.randint(1000, 9999)}.jpg"
    
    issue = {
        "user_id": user['id'],
        "issue_type": issue_type,
        "description": description,
        "priority": priority,
        "latitude": round(latitude, 14),
        "longitude": round(longitude, 14),
        "status": status,
        "is_anonymous": is_anonymous,
        "id": issue_id,
        "created_at": created_at.isoformat() + 'Z',
        "updated_at": updated_at.isoformat() + 'Z',
        "location_address": street
    }
    
    if image_path:
        issue["image_path"] = image_path
    
    # Add comments and status history for in_progress and resolved issues
    if status in ['in_progress', 'resolved']:
        issue["public_comments"] = [{
            "id": f"comment-{issue_id[:8]}",
            "issue_id": issue_id,
            "author_type": "admin",
            "author_id": "admin-1",
            "author_name": "City Administrator",
            "comment": "We have received your report and our team is working on the resolution." if status == 'in_progress' else "We have received your report and our team has completed the resolution.",
            "created_at": updated_at.isoformat() + 'Z'
        }]
        
        issue["status_history"] = [{
            "id": f"status-{issue_id[:8]}",
            "issue_id": issue_id,
            "old_status": "pending",
            "new_status": status,
            "changed_by": "admin-1",
            "changed_by_name": "City Administrator",
            "changed_at": updated_at.isoformat() + 'Z',
            "comment": "Issue assigned to relevant department" if status == 'in_progress' else "Issue resolved successfully"
        }]
    else:
        issue["public_comments"] = []
        issue["status_history"] = []
    
    new_issues.append(issue)

# Combine with existing issues
all_issues = existing_issues + new_issues

# Save to file
output_data = {"issues": all_issues}

with open('src/data/issues.json', 'w') as f:
    json.dump(output_data, f, indent=2)

print(f"\n✅ Successfully generated 200 new issues!")
print(f"Total issues now: {len(all_issues)}")
print(f"\nBreakdown:")
print(f"- Pending: {sum(1 for i in new_issues if i['status'] == 'pending')}")
print(f"- In Progress: {sum(1 for i in new_issues if i['status'] == 'in_progress')}")
print(f"- Resolved: {sum(1 for i in new_issues if i['status'] == 'resolved')}")
print(f"- With Images: {sum(1 for i in new_issues if 'image_path' in i)}")
print(f"- Anonymous: {sum(1 for i in new_issues if i['is_anonymous'])}")
print(f"\n⚠️  Note: Also update server/src/data/issues.json to match!")
