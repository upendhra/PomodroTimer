# Daily Stats Architecture - Free Tier Optimization

## 🎯 **Problem Solved**

**Free Tier Challenge**: Individual task storage leads to rapid database growth and Supabase limits.
- User creates 10 tasks/day × 365 = **3,650 tasks/year**
- With 100 users = **365,000 rows** → Hits 500MB limit quickly

## 🏗️ **Solution: Daily Aggregated Stats**

Instead of storing individual tasks forever, we aggregate daily statistics that persist even when tasks are deleted.

### **📊 What We Track Daily**

```typescript
interface DailyAchievement {
  // Task Metrics (preserved forever)
  tasks_created: number;      // Tasks planned that day
  tasks_completed: number;    // Tasks marked as complete
  planned_hours: number;      // Total planned duration
  completed_hours: number;    // Actual time spent

  // Session Metrics
  focus_sessions: number;     // Focus sessions completed
  break_sessions: number;     // Break sessions completed
  total_session_time: number; // Total session time (minutes)

  // Achievement Tracking
  current_streak: number;     // Streak at end of day
  longest_streak: number;     // Best streak up to this day
}
```

### **🔄 Data Lifecycle**

```
Day 0-7: Keep detailed data
├── Tasks table (active management)
├── Recent sessions (time tracking)
└── Daily achievements (aggregates)

Day 8+: Archive old data
├── Move completed tasks → daily_achievements
├── Aggregate sessions → daily_achievements
└── Delete old task/session records
```

## 📈 **Reports Available**

### **Weekly Report**
```typescript
{
  total_tasks_created: 45,
  total_tasks_completed: 38,
  total_focus_sessions: 156,
  total_planned_hours: 67.5,
  total_completed_hours: 52.3,
  avg_daily_streak: 4.2,
  best_streak: 12
}
```

### **Monthly Report**
```typescript
{
  total_tasks_created: 198,
  total_tasks_completed: 167,
  total_focus_sessions: 682,
  total_planned_hours: 295.5,
  active_days: 22,
  completion_rate: 84.3  // percentage
}
```

### **Yearly Report**
```typescript
{
  total_tasks_created: 2356,
  total_tasks_completed: 1987,
  total_focus_sessions: 8234,
  active_days: 287,
  completion_rate: 84.3
}
```

## 🚀 **Implementation Steps**

### **1. Database Setup**

Run the SQL files in order:
```bash
# 1. New tables and functions
supabase-schema-daily-stats.sql

# 2. Archiving functions
supabase-archiving-functions.sql

# 3. Report queries
supabase-report-queries.sql
```

### **2. Application Integration**

```typescript
import { DailyStatsService } from '@/services/dailyStatsService';

// When user marks task complete
await DailyStatsService.recordTaskCompletion(projectId, taskDuration, actualDuration);

// When session completes
await DailyStatsService.recordSession(projectId, {
  task_id: currentTask?.id,
  task_title: currentTask?.title,
  date: today,
  start_time: sessionStart,
  end_time: sessionEnd,
  duration_minutes: sessionDuration,
  session_type: mode === 'focus' ? 'focus' : mode === 'short' ? 'short_break' : 'long_break',
  completed: true
});

// Check daily limit before creating task
const canCreate = await DailyStatsService.canCreateTaskToday(projectId);
if (!canCreate) {
  alert("You've reached the daily limit of 10 tasks. Try again tomorrow!");
}
```

### **3. Scheduled Maintenance**

Set up a daily cron job to archive old data:
```sql
-- Run daily maintenance (archive old data)
SELECT * FROM daily_maintenance();
```

## 📊 **Storage Optimization**

### **Before (Individual Tasks)**
- **365 tasks/year** per user
- **Grows indefinitely** → hits limits fast

### **After (Daily Aggregates)**
- **365 achievement records/year** per user
- **Fixed growth** → predictable storage
- **Rich reports** → all historical data preserved

### **Data Retention Strategy**
```
Active Tasks: 7 days (for current management)
Recent Sessions: 7 days (for detailed time tracking)
Daily Achievements: Forever (core historical data)
Archived Tasks: 90 days (then deleted)
```

## 🎯 **Key Benefits**

✅ **Free Tier Friendly** - Fixed storage growth  
✅ **Rich Analytics** - Weekly/Monthly/Yearly reports  
✅ **Data Integrity** - Stats preserved even when tasks deleted  
✅ **Performance** - Fast queries on aggregated data  
✅ **Scalable** - Works for thousands of users  

## 🔧 **API Endpoints**

```
GET /api/reports?type=weekly&projectId=123
GET /api/reports?type=monthly&projectId=123
GET /api/reports?type=yearly&projectId=123

POST /api/reports (update daily achievements)
```

## 📈 **Usage Examples**

### **Check Daily Limit**
```typescript
const canCreate = await DailyStatsService.canCreateTaskToday(projectId);
```

### **Get Weekly Progress**
```typescript
const weekly = await DailyStatsService.getWeeklyReport(projectId);
console.log(`Completed ${weekly.total_tasks_completed} tasks this week!`);
```

### **View Yearly Trends**
```typescript
const yearly = await DailyStatsService.getYearlyReport(projectId);
console.log(`Your completion rate: ${yearly.completion_rate}%`);
```

---

**🎉 Result**: Powerful analytics with minimal storage footprint! Perfect for free tier constraints while providing rich insights into user productivity patterns.
