export async function POST(req) {
  // Parse JSON body
  const body = await req.json();
  console.log("user_id:", body.user_id);
  console.log("selected_videos:", body.selected_videos);
  console.log("email:", body.email);

  // TODO: store in the database

  return new Response(
    JSON.stringify({ message: "selected videos stored successfully" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
