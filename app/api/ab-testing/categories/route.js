export async function POST(req) {
  // Parse JSON body
  const body = await req.json();
  console.log("Received keywords:", body.keywords);

  // TODO: send a list of videos according to the keywords

  // Simulate a 10-second delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Sample response data
  const responseData = {
    user_id: "user_12345",
    video_list: [
      {
        id: "_19pRsZRiz4",
        title: "A.I. Artificial Intelligence - Official® Trailer [HD]",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
      },
      {
        id: "ad79nYk2keg",
        title: "Purdue - Professional Certificate in AI and Machine Learning",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
      },
      {
        id: "_19pRsZRiz4",
        title: "A.I. Artificial Intelligence - Official® Trailer [HD]",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
      },
      {
        id: "ad79nYk2keg",
        title: "Purdue - Professional Certificate in AI and Machine Learning",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
      },
      {
        id: "_19pRsZRiz4",
        title: "A.I. Artificial Intelligence - Official® Trailer [HD]",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
      },
      {
        id: "ad79nYk2keg",
        title: "Purdue - Professional Certificate in AI and Machine Learning",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
      },
      {
        id: "_19pRsZRiz4",
        title: "A.I. Artificial Intelligence - Official® Trailer [HD]",
        thumbnail: "https://i.ytimg.com/vi/_19pRsZRiz4/hqdefault.jpg",
      },
      {
        id: "ad79nYk2keg",
        title: "Purdue - Professional Certificate in AI and Machine Learning",
        thumbnail: "https://i.ytimg.com/vi/ad79nYk2keg/hqdefault.jpg",
      },
    ],
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
