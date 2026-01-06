import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch poll results and check if user has voted
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleUid = searchParams.get('article_uid');
    
    if (!articleUid) {
      return NextResponse.json(
        { error: 'article_uid is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    // Get poll results
    const { data: results, error: resultsError } = await supabase
      .rpc('get_poll_results', { p_article_uid: articleUid });

    if (resultsError) {
      console.error('Error fetching poll results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch poll results' },
        { status: 500 }
      );
    }

    // Check if user has voted (only if authenticated)
    let userVote = null;
    if (user) {
      const { data: voteData, error: voteError } = await supabase
        .rpc('check_user_vote', { 
          p_article_uid: articleUid,
          p_user_id: user.id 
        });

      if (!voteError && voteData) {
        userVote = voteData;
      }
    }

    return NextResponse.json({
      success: true,
      poll_results: results,
      user_vote: userVote,
      is_authenticated: !!user
    });

  } catch (error) {
    console.error('Poll GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Cast a vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_uid, option_index, option_text, poll_question, locale = 'en-us' } = body;

    // Validate required fields
    if (!article_uid || option_index === undefined || !option_text || !poll_question) {
      return NextResponse.json(
        { error: 'Missing required fields: article_uid, option_index, option_text, poll_question' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    // Get current user - must be authenticated to vote
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { 
          error: 'authentication_required',
          message: 'You must be signed in to vote'
        },
        { status: 401 }
      );
    }

    // Cast the vote using the database function
    const { data, error } = await supabase
      .rpc('cast_poll_vote', {
        p_article_uid: article_uid,
        p_option_index: option_index,
        p_option_text: option_text,
        p_poll_question: poll_question,
        p_user_id: user.id,
        p_locale: locale
      });

    if (error) {
      console.error('Error casting vote:', error);
      return NextResponse.json(
        { error: 'Failed to cast vote' },
        { status: 500 }
      );
    }

    // Get updated poll results
    const { data: updatedResults } = await supabase
      .rpc('get_poll_results', { p_article_uid: article_uid });

    return NextResponse.json({
      ...data,
      poll_results: updatedResults
    });

  } catch (error) {
    console.error('Poll POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update/Change a vote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_uid, option_index, option_text } = body;

    if (!article_uid || option_index === undefined || !option_text) {
      return NextResponse.json(
        { error: 'Missing required fields: article_uid, option_index, option_text' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'authentication_required', message: 'You must be signed in' },
        { status: 401 }
      );
    }

    // Get the user's current vote
    const { data: currentVote, error: fetchError } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('article_uid', article_uid)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentVote) {
      return NextResponse.json(
        { error: 'No existing vote found' },
        { status: 404 }
      );
    }

    const oldOptionIndex = currentVote.option_index;

    // Update the user's vote
    const { error: updateError } = await supabase
      .from('poll_votes')
      .update({ 
        option_index: option_index,
        option_text: option_text,
        created_at: new Date().toISOString()
      })
      .eq('article_uid', article_uid)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating vote:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vote' },
        { status: 500 }
      );
    }

    // Decrement old option count
    const { data: oldCount } = await supabase
      .from('poll_vote_counts')
      .select('vote_count')
      .eq('article_uid', article_uid)
      .eq('option_index', oldOptionIndex)
      .single();

    if (oldCount && oldCount.vote_count > 0) {
      await supabase
        .from('poll_vote_counts')
        .update({ 
          vote_count: oldCount.vote_count - 1,
          last_updated: new Date().toISOString()
        })
        .eq('article_uid', article_uid)
        .eq('option_index', oldOptionIndex);
    }

    // Increment new option count
    const { data: newCount } = await supabase
      .from('poll_vote_counts')
      .select('vote_count')
      .eq('article_uid', article_uid)
      .eq('option_index', option_index)
      .single();

    if (newCount) {
      await supabase
        .from('poll_vote_counts')
        .update({ 
          vote_count: newCount.vote_count + 1,
          last_updated: new Date().toISOString()
        })
        .eq('article_uid', article_uid)
        .eq('option_index', option_index);
    } else {
      await supabase
        .from('poll_vote_counts')
        .insert({
          article_uid: article_uid,
          option_index: option_index,
          option_text: option_text,
          vote_count: 1
        });
    }

    // Get updated poll results
    const { data: updatedResults } = await supabase
      .rpc('get_poll_results', { p_article_uid: article_uid });

    return NextResponse.json({
      success: true,
      message: 'Vote updated successfully',
      voted_option: option_index,
      poll_results: updatedResults
    });

  } catch (error) {
    console.error('Poll PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

