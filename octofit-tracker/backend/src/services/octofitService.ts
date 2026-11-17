import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const data = input as Record<string, unknown>;
  
  // Validate required fields
  if (!data.userId || !data.teamId || !data.type || data.minutes === undefined) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    throw Object.assign(error, { status: 400 });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(data.userId as string) || !mongoose.Types.ObjectId.isValid(data.teamId as string)) {
    const error = new Error('Invalid userId or teamId format');
    throw Object.assign(error, { status: 400 });
  }

  // Check if user and team exist
  const user = await User.findById(data.userId);
  const team = await Team.findById(data.teamId);

  if (!user || !team) {
    const error = new Error('User or team not found');
    throw Object.assign(error, { status: 404 });
  }

  // Calculate points based on minutes (example: 1 point per minute)
  const points = Number(data.minutes);
  const occurredAt = new Date();

  return Activity.create({
    user: data.userId,
    team: data.teamId,
    type: data.type,
    minutes: data.minutes,
    points,
    occurredAt,
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const data = input as Record<string, unknown>;
  
  // Validate required fields
  if (!data.name) {
    const error = new Error('Team name is required');
    throw Object.assign(error, { status: 400 });
  }

  const members = (data.members as string[]) || [];
  
  // Validate member IDs if provided
  for (const memberId of members) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const error = new Error('Invalid member ID format');
      throw Object.assign(error, { status: 400 });
    }
  }

  return Team.create({
    name: data.name,
    mascot: data.mascot || '',
    members,
  });
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $sort: { totalPoints: -1 },
    },
    {
      $project: {
        _id: 0,
        teamName: '$teamData.name',
        totalPoints: 1,
      },
    },
  ]);

  // Add rank
  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });

  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 404 });
  }

  // Get recent activities for this user
  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();

  // Determine focus based on user's goal or most recent activity
  let targetFocus = user.fitnessGoal || 'endurance';
  if (recentActivities.length > 0) {
    const activityType = recentActivities[0].type;
    if (activityType === 'run') {
      targetFocus = 'endurance';
    } else if (activityType === 'strength') {
      targetFocus = 'strength';
    } else if (activityType === 'cycle') {
      targetFocus = 'endurance';
    }
  }

  // Find workouts matching the target focus
  const suggestions = await Workout.find({ focus: targetFocus })
    .limit(5)
    .lean();

  // Add reason for each suggestion
  return suggestions.map((workout) => ({
    ...workout,
    reason: `Based on your ${targetFocus} activities and goal.`,
  }));
}

export { User };
