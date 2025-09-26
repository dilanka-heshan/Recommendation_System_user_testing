# Video Recommendation System Implementation

## Overview

This implementation integrates your Cloud Run recommendation service with the frontend application. After users select their preferences, the system will fetch personalized video recommendations and display them in a user-friendly interface.

## How It Works

### 1. User Flow

1. User selects categories (step 1)
2. System calls both:
   - Original AB testing API (`/api/ab-testing/categories`)
   - New recommendation API (`/api/recommendations`)
3. User sees personalized recommendations with thumbnails, titles, and descriptions (step 2)
4. User selects videos and submits (step 3)

### 2. New API Route: `/api/recommendations`

- **Location**: `app/api/recommendations/route.ts`
- **Method**: POST
- **Body**: `{ user_id: string, top_k?: number }`
- **Returns**: `{ user_id: string, videos: Video[], count: number }`

### 3. Updated Components

- **Recommendations.tsx**: Now displays video cards with:
  - Video thumbnail
  - Video title (truncated to 2 lines)
  - Video description (truncated to 3 lines)
  - Selection indicator with checkmark
  - Hover effects and animations

### 4. Configuration

- **Environment Variable**: `CLOUD_RUN_URL`
  - Local: `http://localhost:8000`
  - Production: Your actual Cloud Run service URL

## Setup Instructions

1. **Add Environment Variable**

   ```bash
   # In your .env.local file
   CLOUD_RUN_URL=http://localhost:8000
   ```

2. **For Production Deployment**
   Replace with your actual Cloud Run URL:

   ```bash
   CLOUD_RUN_URL=https://your-service-name-xxxxxxxxxx-uc.a.run.app
   ```

3. **Install Dependencies** (if needed)

   ```bash
   pnpm install
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## API Integration Details

### Backend Service Call

The frontend calls your Cloud Run service at:

- **Endpoint**: `/run-workflow/run_workflow_video_ids`
- **Method**: POST
- **Payload**:
  ```json
  {
    "user_id": "10ebd9e3-56bd-40ae-a8df-20d1f5458817",
    "top_k": 4
  }
  ```

### Expected Response Format

Your backend should return:

```json
{
  "videos": [
    {
      "id": "video_id_1",
      "title": "Video Title",
      "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
      "description": "Video description..."
    }
  ]
}
```

## Fallback Behavior

- If recommendation API fails, the app falls back to the original AB testing flow
- Error handling ensures the user experience isn't disrupted
- Console logging helps with debugging

## Features

- **Responsive Design**: Works on desktop and mobile
- **Interactive Selection**: Click to select/deselect videos
- **Visual Feedback**: Selected videos show green border and checkmark
- **Loading States**: Smooth loading animations
- **Error Handling**: Graceful fallbacks

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your Cloud Run service allows requests from your frontend domain
2. **Network Errors**: Check if the CLOUD_RUN_URL is correct and accessible
3. **Response Format**: Verify your backend returns the expected JSON structure

### Debug Tips

- Check browser console for API call logs
- Verify the recommendation API is being called after category selection
- Test the Cloud Run service directly using the Swagger docs at `http://localhost:8000/docs`
