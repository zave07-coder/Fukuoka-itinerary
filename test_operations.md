# AI Command Parser Test Cases

## Test these commands in the AI chat:

### 1. ADD Operation
- "Add TeamLab Forest after Canal City on Day 3"
- "Can you add a ramen shop to Day 4?"
- "I want to visit Fukuoka Tower on Day 2"

**Expected Output:**
```json
OPERATION: {"type": "add", "day": "Day 3", "location": {"name": "TeamLab Forest", "lat": 33.5904, "lng": 130.4017, "type": "attraction"}, "position": "after Canal City"}
```

---

### 2. REMOVE Operation
- "Remove Ohori Park from Day 2"
- "Delete the ramen museum visit"
- "Take out Fukuoka Castle from the itinerary"

**Expected Output:**
```json
OPERATION: {"type": "remove", "day": "Day 2", "location_name": "Ohori Park"}
```

---

### 3. MOVE Operation
- "Move Ohori Park from Day 2 to Day 3"
- "Can we shift Canal City to Day 5?"
- "Change Fukuoka Tower from Day 4 to Day 2"

**Expected Output:**
```json
OPERATION: {"type": "move", "location_name": "Ohori Park", "from_day": "Day 2", "to_day": "Day 3", "position": "end"}
```

---

### 4. UPDATE Operation
- "Change Ramen Stadium time to 6pm"
- "Update the notes for Fukuoka Tower to mention best sunset spot"
- "Make Canal City visit at 2pm instead"

**Expected Output:**
```json
OPERATION: {"type": "update", "day": "Day 3", "location_name": "Ramen Stadium", "changes": {"time": "18:00"}}
```

---

### 5. REORDER Operation
- "Swap Canal City and Ramen Stadium on Day 3"
- "Put Fukuoka Tower before Ohori Park"
- "Move the ramen lunch to after shopping"

**Expected Output:**
```json
OPERATION: {"type": "reorder", "day": "Day 3", "location_name": "Canal City", "new_position": "after Ramen Stadium"}
```

---

### 6. REPLACE Operation
- "Replace Day 5 with a beach day at Momochi Seaside Park"
- "Change the morning activity to something else"
- "Can we do a different activity instead of the museum?"

**Expected Output:**
```json
OPERATION: {"type": "replace", "target": "Day 5", "replacement": {"theme": "beach day", "locations": [...]}}
```

---

## Database Verification

After each operation, check the database:

```sql
-- View recent changes
SELECT * FROM change_log ORDER BY created_at DESC LIMIT 10;

-- View by operation type
SELECT operation_type, COUNT(*) FROM change_log GROUP BY operation_type;

-- View undo stack (non-undone changes)
SELECT * FROM change_log WHERE is_undone = FALSE ORDER BY created_at DESC;
```
