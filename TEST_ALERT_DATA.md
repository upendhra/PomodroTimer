# Test Alert Tracking Feature

## Quick Test - Add Sample Alert Data

### Option 1: Via Browser Console

Open browser console (F12) and run:

```javascript
// Simulate completing a task with alert data
const testTask = {
  id: 'test-' + Date.now(),
  title: 'Test Task with Alerts',
  priority: 'high',
  duration: 25,
  status: 'achieved',
  completedAt: new Date().toISOString(),
  sessionsCompleted: 1,
  actualDuration: 25,
  focusedAlerts: 5,    // User was focused 5 times
  deviatedAlerts: 2,   // User was distracted 2 times
};

// Add to your tasks array
// (This depends on your state management)
```

### Option 2: Update Existing Task

When you complete a task in the UI, manually update it:

```typescript
onTaskUpdate(taskId, {
  completedAt: new Date().toISOString(),
  status: 'achieved',
  focusedAlerts: 3,
  deviatedAlerts: 1,
});
```

### Option 3: Database Update

If you want persistent test data, update Supabase:

```sql
UPDATE tasks 
SET 
  focused_alerts = 5,
  deviated_alerts = 2,
  status = 'achieved',
  completed_at = NOW()
WHERE id = 'your-task-id';
```

---

## Expected Results

### In "Achieved Today" Section:

**Alert Stats Card Appears:**
```
┌─────────────────────────────────────┐
│ 👁️ Stay-on-Task Alerts     7 total │
├─────────────────────────────────────┤
│   ✅ Focused    ❌ Deviated  🎯 Rate │
│       5             2          71%  │
├─────────────────────────────────────┤
│ ████████████████░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────┘
```

**Task Card Shows:**
```
┌─────────────────────────────────────┐
│ ✓ Test Task with Alerts        25m │
│ ✅ 5  ❌ 2                          │
└─────────────────────────────────────┘
```

---

## Integration Points

### Where to Add Alert Tracking:

1. **Timer Component** - When alert dialog appears
2. **Session Complete Handler** - Aggregate session alerts
3. **Task Update Function** - Increment alert counts
4. **Database Schema** - Add columns if not present:
   - `focused_alerts` (integer)
   - `deviated_alerts` (integer)

### Example Timer Integration:

```typescript
// In your Pomodoro timer component
const [sessionAlerts, setSessionAlerts] = useState({
  focused: 0,
  deviated: 0
});

const showStayOnTaskAlert = () => {
  // Show dialog: "Are you still focused on the task?"
  const response = await showAlertDialog();
  
  if (response === 'focused') {
    setSessionAlerts(prev => ({
      ...prev,
      focused: prev.focused + 1
    }));
  } else {
    setSessionAlerts(prev => ({
      ...prev,
      deviated: prev.deviated + 1
    }));
  }
};

const handleSessionComplete = () => {
  // Update task with alert data
  onTaskUpdate(currentTask.id, {
    focusedAlerts: (currentTask.focusedAlerts || 0) + sessionAlerts.focused,
    deviatedAlerts: (currentTask.deviatedAlerts || 0) + sessionAlerts.deviated,
  });
  
  // Reset for next session
  setSessionAlerts({ focused: 0, deviated: 0 });
};
```

---

## Color Coding

| Response | Icon | Color | Meaning |
|----------|------|-------|---------|
| Focused | ✅ Focus | Green (#34d399) | User stayed on task |
| Deviated | ❌ EyeOff | Red (#f87171) | User got distracted |
| Focus Rate | 🎯 Target | Indigo (#818cf8) | Overall focus % |

---

## Calculations

```typescript
// Daily totals
const focusedAlerts = achievedTasks.reduce(
  (sum, task) => sum + (task.focusedAlerts || 0), 0
);
const deviatedAlerts = achievedTasks.reduce(
  (sum, task) => sum + (task.deviatedAlerts || 0), 0
);

// Focus rate
const totalAlerts = focusedAlerts + deviatedAlerts;
const focusRate = totalAlerts > 0 
  ? ((focusedAlerts / totalAlerts) * 100).toFixed(0) 
  : '0';
```

---

## Notes

- Alert section only appears when `totalAlerts > 0`
- Per-task indicators only show when task has alerts
- Data persists across date navigation
- Historical data viewable via calendar picker
