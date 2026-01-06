import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Fetch poll results for multiple articles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_uids } = body;

    if (!article_uids || !Array.isArray(article_uids) || article_uids.length === 0) {
      return NextResponse.json(
        { error: 'article_uids array is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch poll results for all articles
    const pollResults: Record<string, any> = {};
    const userVotes: Record<string, any> = {};

    // Get vote counts for all articles
    const { data: voteCounts, error: countsError } = await supabase
      .from('poll_vote_counts')
      .select('*')
      .in('article_uid', article_uids);

    if (countsError) {
      console.error('Error fetching vote counts:', countsError);
    }

    // Organize vote counts by article
    if (voteCounts) {
      for (const count of voteCounts) {
        if (!pollResults[count.article_uid]) {
          pollResults[count.article_uid] = {
            results: [],
            total_votes: 0
          };
        }
        pollResults[count.article_uid].results.push({
          option_index: count.option_index,
          option_text: count.option_text,
          vote_count: count.vote_count
        });
        pollResults[count.article_uid].total_votes += count.vote_count;
      }

      // Calculate percentages
      for (const articleUid of Object.keys(pollResults)) {
        const total = pollResults[articleUid].total_votes;
        pollResults[articleUid].results = pollResults[articleUid].results.map((r: any) => ({
          ...r,
          percentage: total > 0 ? Math.round((r.vote_count / total) * 100) : 0
        }));
      }
    }

    // Get user's votes if authenticated
    if (user) {
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('article_uid, option_index, created_at')
        .eq('user_id', user.id)
        .in('article_uid', article_uids);

      if (!votesError && votes) {
        for (const vote of votes) {
          userVotes[vote.article_uid] = {
            has_voted: true,
            voted_option: vote.option_index,
            voted_at: vote.created_at
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      poll_results: pollResults,
      user_votes: userVotes,
      is_authenticated: !!user
    });

  } catch (error) {
    console.error('Poll batch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

