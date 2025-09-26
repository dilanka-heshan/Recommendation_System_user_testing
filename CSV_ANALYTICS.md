# Simple CSV Analytics System

## 📊 Overview

This system automatically tracks user interactions with video recommendations and saves all data to CSV files for easy analysis. No database setup required!

## 🎯 What Gets Tracked

### 1. Video Interactions (`video_interactions.csv`)

Every time a user interacts with videos:

- **Views** - When recommended videos are displayed
- **Clicks** - When users click on any video
- **Selections** - When users select videos for their feed
- **Deselections** - When users unselect videos

**CSV Columns:**

```
timestamp,user_id,video_id,interaction_type,is_recommended,session_id
```

### 2. Recommendation Sessions (`recommendation_sessions.csv`)

Summary of each complete recommendation session:

- Which videos were recommended
- Which videos were selected
- Recommendation accuracy percentage

**CSV Columns:**

```
timestamp,user_id,recommended_videos,selected_videos,total_recommended,selected_recommended,recommendation_accuracy
```

## 🚀 How It Works

1. **User goes through recommendation flow** → System tracks all interactions
2. **Data is automatically saved** to CSV files in `analytics-data/` folder
3. **Download CSV files** from `/analytics` page for analysis
4. **Analyze in Excel/Python** → Get insights on recommendation performance

## 📁 File Locations

CSV files are saved in your project:

```
youtube-to-newsletter/frontend/user-feedbacks/analytics-data/
├── video_interactions.csv      # Individual user actions
└── recommendation_sessions.csv # Session summaries with accuracy
```

## 📈 Example Data Analysis

### In Excel/Google Sheets:

1. **Calculate average recommendation accuracy** across all sessions
2. **Count interactions by type** (views vs clicks vs selections)
3. **Identify most engaging videos** (highest click rates)
4. **Track accuracy trends** over time

### In Python/Pandas:

```python
import pandas as pd

# Load data
interactions = pd.read_csv('video_interactions.csv')
sessions = pd.read_csv('recommendation_sessions.csv')

# Calculate overall recommendation accuracy
avg_accuracy = sessions['recommendation_accuracy'].mean()
print(f"Average recommendation accuracy: {avg_accuracy:.2f}%")

# Count clicks on recommended vs non-recommended videos
click_analysis = interactions[interactions['interaction_type'] == 'click'].groupby('is_recommended').size()
print(click_analysis)
```

## 🎯 Key Insights You'll Get

1. **Recommendation Quality**: What percentage of your recommended videos do users actually select?
2. **User Behavior**: Do users click before selecting? How many videos do they view?
3. **System Performance**: Are personalized recommendations better than random suggestions?
4. **A/B Testing**: Compare different recommendation approaches

## 📊 Analytics Dashboard

Visit `/analytics` in your app to:

- ✅ Check if CSV files exist
- ⬇️ Download CSV files directly
- 📋 See CSV structure documentation
- 🔍 Get analysis ideas

## 🛠️ Setup (Super Simple!)

1. **No setup needed!** - CSV files are created automatically when users interact with videos
2. **Use the app** - Go through the recommendation flow to generate data
3. **Download data** - Visit `/analytics` page to download CSV files
4. **Analyze** - Open in Excel, Python, R, or any data analysis tool

## 📊 Sample Questions to Answer

### Business Questions:

- Are our video recommendations helping users find content they want?
- What's our recommendation system's accuracy rate?
- Which videos are most engaging to users?

### Data Science Questions:

- Do users click more on recommended vs non-recommended videos?
- What's the correlation between viewing and selecting videos?
- How does user behavior change over time?

### Product Questions:

- Should we show more or fewer recommended videos?
- Are users overwhelmed by choices?
- What interaction patterns lead to higher satisfaction?

## 🎉 Benefits of CSV Approach

✅ **No database setup required**  
✅ **Works with any data analysis tool**  
✅ **Easy to share data with team**  
✅ **Version control friendly**  
✅ **Simple backup and archival**  
✅ **Universal format - works everywhere**

The CSV files give you all the data you need to analyze your recommendation system's performance and optimize user experience! 🚀
