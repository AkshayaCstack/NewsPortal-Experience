import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Fetch user's own submissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's submissions
    const { data: submissions, error } = await supabase
      .from("citizen_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error in GET /api/citizen-submissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to submit a story" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, summary, body: storyBody, category, location } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!storyBody) {
      return NextResponse.json(
        { error: "Story content is required" },
        { status: 400 }
      );
    }

    // Insert submission
    const { data: submission, error } = await supabase
      .from("citizen_submissions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        summary: summary?.trim() || null,
        body: storyBody,
        category: category?.trim() || null,
        location: location?.trim() || null,
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating submission:", error);
      return NextResponse.json(
        { error: "Failed to submit story" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      submission,
      message: "Your story has been submitted for review!" 
    });
  } catch (error) {
    console.error("Error in POST /api/citizen-submissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update own pending submission
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, summary, body: storyBody, category, location } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Check if submission exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("citizen_submissions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Only allow editing pending submissions
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending submissions can be edited" },
        { status: 403 }
      );
    }

    // Update submission
    const { data: submission, error } = await supabase
      .from("citizen_submissions")
      .update({
        title: title?.trim() || existing.title,
        summary: summary?.trim() || existing.summary,
        body: storyBody || existing.body,
        category: category?.trim() || existing.category,
        location: location?.trim() || existing.location
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission:", error);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      submission,
      message: "Your story has been updated!" 
    });
  } catch (error) {
    console.error("Error in PUT /api/citizen-submissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

