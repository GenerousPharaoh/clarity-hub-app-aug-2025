import supabaseClient from './supabaseClient';

export interface CaseProgressMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number; // in days
  upcomingDeadlines: number;
  criticalDeadlines: number;
  documentsUploaded: number;
  evidenceCollected: number;
  progressTrend: 'up' | 'down' | 'stable';
}

export interface DocumentStatistics {
  totalFiles: number;
  totalSize: number; // in bytes
  fileTypeBreakdown: Record<string, number>;
  uploadTrend: Array<{ date: string; count: number }>;
  averageFileSize: number;
  largestFile: { name: string; size: number };
  recentUploads: number; // last 7 days
  indexedFiles: number;
  unindexedFiles: number;
}

export interface TeamActivityMetrics {
  totalUsers: number;
  activeUsers: number; // active in last 7 days
  userActivity: Array<{
    userId: string;
    userName: string;
    actionsCount: number;
    lastActive: string;
    topActions: Record<string, number>;
  }>;
  collaborationScore: number;
  communicationFrequency: number;
  averageResponseTime: number; // in hours
}

export interface DeadlineComplianceMetrics {
  totalDeadlines: number;
  metDeadlines: number;
  missedDeadlines: number;
  upcomingDeadlines: number;
  complianceRate: number;
  averageDaysEarly: number;
  criticalMissed: number;
  deadlinesByType: Record<string, { total: number; met: number; missed: number }>;
  monthlyTrend: Array<{ month: string; compliance: number }>;
}

export interface TimeTrackingMetrics {
  totalTimeLogged: number; // in minutes
  billableTime: number;
  nonBillableTime: number;
  averageSessionLength: number;
  timeByTask: Array<{
    taskId: string;
    taskTitle: string;
    totalTime: number;
    billableTime: number;
    efficiency: number;
  }>;
  timeByUser: Array<{
    userId: string;
    userName: string;
    totalTime: number;
    billableTime: number;
    averageDaily: number;
  }>;
  dailyTrend: Array<{ date: string; minutes: number; billable: number }>;
}

export interface OverviewMetrics {
  caseProgress: number;
  documentsProcessed: number;
  deadlinesUpcoming: number;
  teamActivity: number;
  recentSearches: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

class AnalyticsService {
  /**
   * Get comprehensive overview metrics for a project
   */
  async getOverviewMetrics(projectId: string): Promise<OverviewMetrics> {
    try {
      const [
        caseProgress,
        documentsProcessed,
        deadlinesUpcoming,
        teamActivity,
        recentSearches
      ] = await Promise.all([
        this.getCaseProgressMetrics(projectId),
        this.getDocumentStatistics(projectId),
        this.getDeadlineComplianceMetrics(projectId),
        this.getTeamActivityMetrics(projectId),
        this.getRecentSearchCount(projectId)
      ]);

      // Calculate system health based on various factors
      const systemHealth = this.calculateSystemHealth({
        caseProgress,
        documentsProcessed,
        deadlinesUpcoming,
        teamActivity
      });

      return {
        caseProgress: caseProgress.completionRate,
        documentsProcessed: documentsProcessed.totalFiles,
        deadlinesUpcoming: deadlinesUpcoming.upcomingDeadlines,
        teamActivity: teamActivity.activeUsers,
        recentSearches,
        systemHealth
      };

    } catch (error) {
      console.error('Error getting overview metrics:', error);
      throw error;
    }
  }

  /**
   * Get case progress metrics
   */
  async getCaseProgressMetrics(projectId: string): Promise<CaseProgressMetrics> {
    try {
      // Get task statistics
      const { data: tasks } = await supabaseClient
        .from('legal_tasks')
        .select('id, status, created_at, completion_date, due_date')
        .eq('project_id', projectId);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      
      const now = new Date();
      const overdueTasks = tasks?.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
      ).length || 0;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time
      const completedTasksWithDates = tasks?.filter(t => 
        t.status === 'completed' && t.created_at && t.completion_date
      ) || [];
      
      const averageCompletionTime = completedTasksWithDates.length > 0
        ? completedTasksWithDates.reduce((sum, task) => {
            const created = new Date(task.created_at!);
            const completed = new Date(task.completion_date!);
            return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedTasksWithDates.length
        : 0;

      // Get deadline information
      const { data: deadlines } = await supabaseClient
        .from('legal_deadlines')
        .select('due_date, is_critical, status')
        .eq('project_id', projectId);

      const upcomingDeadlines = deadlines?.filter(d => 
        d.due_date && new Date(d.due_date) > now && d.status === 'pending'
      ).length || 0;

      const criticalDeadlines = deadlines?.filter(d => 
        d.due_date && new Date(d.due_date) > now && d.is_critical && d.status === 'pending'
      ).length || 0;

      // Get document and evidence counts
      const { count: documentsUploaded } = await supabaseClient
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const { count: evidenceCollected } = await supabaseClient
        .from('evidence_records')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Calculate progress trend (simple implementation)
      const progressTrend = this.calculateProgressTrend(tasks || []);

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime,
        upcomingDeadlines,
        criticalDeadlines,
        documentsUploaded: documentsUploaded || 0,
        evidenceCollected: evidenceCollected || 0,
        progressTrend
      };

    } catch (error) {
      console.error('Error getting case progress metrics:', error);
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(projectId: string): Promise<DocumentStatistics> {
    try {
      const { data: files } = await supabaseClient
        .from('files')
        .select('name, size, file_type, added_at, content_type')
        .eq('project_id', projectId);

      const totalFiles = files?.length || 0;
      const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0;
      const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      // File type breakdown
      const fileTypeBreakdown: Record<string, number> = {};
      files?.forEach(file => {
        fileTypeBreakdown[file.file_type] = (fileTypeBreakdown[file.file_type] || 0) + 1;
      });

      // Upload trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const uploadTrend = this.calculateUploadTrend(files || [], thirtyDaysAgo);

      // Find largest file
      const largestFile = files?.reduce((largest, file) => 
        file.size > largest.size ? file : largest, 
        { name: 'None', size: 0 }
      ) || { name: 'None', size: 0 };

      // Recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUploads = files?.filter(file => 
        new Date(file.added_at) > sevenDaysAgo
      ).length || 0;

      // Get indexed file count
      const { count: indexedFiles } = await supabaseClient
        .from('file_content_search')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const unindexedFiles = totalFiles - (indexedFiles || 0);

      return {
        totalFiles,
        totalSize,
        fileTypeBreakdown,
        uploadTrend,
        averageFileSize,
        largestFile,
        recentUploads,
        indexedFiles: indexedFiles || 0,
        unindexedFiles: Math.max(0, unindexedFiles)
      };

    } catch (error) {
      console.error('Error getting document statistics:', error);
      throw error;
    }
  }

  /**
   * Get team activity metrics
   */
  async getTeamActivityMetrics(projectId: string): Promise<TeamActivityMetrics> {
    try {
      // Get project collaborators
      const { data: collaborators } = await supabaseClient
        .from('project_collaborators')
        .select(`
          user_id,
          role,
          status
        `)
        .eq('project_id', projectId)
        .eq('status', 'active');

      const totalUsers = collaborators?.length || 0;

      // Get activity logs for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activities } = await supabaseClient
        .from('activity_logs')
        .select('user_id, action_type, created_at')
        .eq('project_id', projectId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate active users
      const activeUserIds = new Set(activities?.map(a => a.user_id) || []);
      const activeUsers = activeUserIds.size;

      // Calculate user activity details
      const userActivity = this.calculateUserActivity(activities || [], collaborators || []);

      // Simple collaboration metrics
      const collaborationScore = this.calculateCollaborationScore(activities || []);
      const communicationFrequency = this.calculateCommunicationFrequency(activities || []);
      const averageResponseTime = this.calculateAverageResponseTime(activities || []);

      return {
        totalUsers,
        activeUsers,
        userActivity,
        collaborationScore,
        communicationFrequency,
        averageResponseTime
      };

    } catch (error) {
      console.error('Error getting team activity metrics:', error);
      throw error;
    }
  }

  /**
   * Get deadline compliance metrics
   */
  async getDeadlineComplianceMetrics(projectId: string): Promise<DeadlineComplianceMetrics> {
    try {
      const { data: deadlines } = await supabaseClient
        .from('legal_deadlines')
        .select('due_date, status, deadline_type, is_critical, created_at')
        .eq('project_id', projectId);

      const totalDeadlines = deadlines?.length || 0;
      const metDeadlines = deadlines?.filter(d => d.status === 'completed').length || 0;
      const missedDeadlines = deadlines?.filter(d => d.status === 'missed').length || 0;
      
      const now = new Date();
      const upcomingDeadlines = deadlines?.filter(d => 
        d.due_date && new Date(d.due_date) > now && d.status === 'pending'
      ).length || 0;

      const complianceRate = totalDeadlines > 0 ? (metDeadlines / totalDeadlines) * 100 : 0;

      // Calculate average days early for met deadlines
      const averageDaysEarly = this.calculateAverageDaysEarly(deadlines || []);

      // Critical missed deadlines
      const criticalMissed = deadlines?.filter(d => 
        d.status === 'missed' && d.is_critical
      ).length || 0;

      // Deadlines by type
      const deadlinesByType: Record<string, { total: number; met: number; missed: number }> = {};
      deadlines?.forEach(deadline => {
        const type = deadline.deadline_type;
        if (!deadlinesByType[type]) {
          deadlinesByType[type] = { total: 0, met: 0, missed: 0 };
        }
        deadlinesByType[type].total++;
        if (deadline.status === 'completed') deadlinesByType[type].met++;
        if (deadline.status === 'missed') deadlinesByType[type].missed++;
      });

      // Monthly trend (last 12 months)
      const monthlyTrend = this.calculateDeadlineComplianceTrend(deadlines || []);

      return {
        totalDeadlines,
        metDeadlines,
        missedDeadlines,
        upcomingDeadlines,
        complianceRate,
        averageDaysEarly,
        criticalMissed,
        deadlinesByType,
        monthlyTrend
      };

    } catch (error) {
      console.error('Error getting deadline compliance metrics:', error);
      throw error;
    }
  }

  /**
   * Get time tracking metrics
   */
  async getTimeTrackingMetrics(projectId: string): Promise<TimeTrackingMetrics> {
    try {
      const { data: timeLogs } = await supabaseClient
        .from('task_time_logs')
        .select(`
          *,
          legal_tasks(id, title)
        `)
        .eq('project_id', projectId);

      const totalTimeLogged = timeLogs?.reduce((sum, log) => 
        sum + (log.duration_minutes || 0), 0
      ) || 0;

      const billableTime = timeLogs?.filter(log => log.billable)
        .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

      const nonBillableTime = totalTimeLogged - billableTime;

      const averageSessionLength = timeLogs?.length 
        ? totalTimeLogged / timeLogs.length 
        : 0;

      // Time by task
      const timeByTask = this.calculateTimeByTask(timeLogs || []);

      // Time by user
      const timeByUser = this.calculateTimeByUser(timeLogs || []);

      // Daily trend (last 30 days)
      const dailyTrend = this.calculateDailyTimeTrend(timeLogs || []);

      return {
        totalTimeLogged,
        billableTime,
        nonBillableTime,
        averageSessionLength,
        timeByTask,
        timeByUser,
        dailyTrend
      };

    } catch (error) {
      console.error('Error getting time tracking metrics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data to CSV format
   */
  async exportAnalyticsToCSV(projectId: string, metrics: string[]): Promise<string> {
    try {
      const data: any[] = [];

      if (metrics.includes('caseProgress')) {
        const caseProgress = await this.getCaseProgressMetrics(projectId);
        data.push({
          type: 'Case Progress',
          metric: 'Completion Rate',
          value: `${caseProgress.completionRate.toFixed(1)}%`
        });
        data.push({
          type: 'Case Progress',
          metric: 'Total Tasks',
          value: caseProgress.totalTasks
        });
        data.push({
          type: 'Case Progress',
          metric: 'Completed Tasks',
          value: caseProgress.completedTasks
        });
      }

      if (metrics.includes('documents')) {
        const documents = await this.getDocumentStatistics(projectId);
        data.push({
          type: 'Documents',
          metric: 'Total Files',
          value: documents.totalFiles
        });
        data.push({
          type: 'Documents',
          metric: 'Total Size (MB)',
          value: (documents.totalSize / (1024 * 1024)).toFixed(2)
        });
      }

      // Convert to CSV
      if (data.length === 0) {
        return 'No data available for export';
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      return csvContent;

    } catch (error) {
      console.error('Error exporting analytics to CSV:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateProgressTrend(tasks: any[]): 'up' | 'down' | 'stable' {
    // Simple implementation - could be enhanced with more sophisticated analysis
    const recentTasks = tasks.filter(task => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(task.created_at) > weekAgo;
    });

    const recentCompletions = recentTasks.filter(task => task.status === 'completed').length;
    const totalRecent = recentTasks.length;

    if (totalRecent === 0) return 'stable';
    
    const recentCompletionRate = recentCompletions / totalRecent;
    const overallCompletionRate = tasks.filter(t => t.status === 'completed').length / tasks.length;

    if (recentCompletionRate > overallCompletionRate * 1.1) return 'up';
    if (recentCompletionRate < overallCompletionRate * 0.9) return 'down';
    return 'stable';
  }

  private calculateUploadTrend(files: any[], fromDate: Date): Array<{ date: string; count: number }> {
    const trend: Array<{ date: string; count: number }> = [];
    const dailyCounts: Record<string, number> = {};

    files.forEach(file => {
      const fileDate = new Date(file.added_at);
      if (fileDate >= fromDate) {
        const dateStr = fileDate.toISOString().split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    });

    // Fill in missing days with 0 counts
    const currentDate = new Date(fromDate);
    const today = new Date();
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      trend.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }

  private calculateUserActivity(activities: any[], collaborators: any[]): TeamActivityMetrics['userActivity'] {
    const userActivityMap: Record<string, any> = {};

    activities.forEach(activity => {
      const userId = activity.user_id;
      if (!userActivityMap[userId]) {
        userActivityMap[userId] = {
          userId,
          userName: `User ${userId.substring(0, 8)}`, // Would need to join with user profile
          actionsCount: 0,
          lastActive: activity.created_at,
          topActions: {}
        };
      }

      userActivityMap[userId].actionsCount++;
      userActivityMap[userId].topActions[activity.action_type] = 
        (userActivityMap[userId].topActions[activity.action_type] || 0) + 1;
      
      if (new Date(activity.created_at) > new Date(userActivityMap[userId].lastActive)) {
        userActivityMap[userId].lastActive = activity.created_at;
      }
    });

    return Object.values(userActivityMap);
  }

  private calculateCollaborationScore(activities: any[]): number {
    // Simple collaboration score based on activity diversity and frequency
    const actionTypes = new Set(activities.map(a => a.action_type));
    const uniqueUsers = new Set(activities.map(a => a.user_id));
    
    if (uniqueUsers.size <= 1) return 0;
    
    const diversityScore = actionTypes.size / 10; // Assuming max 10 action types
    const participationScore = Math.min(uniqueUsers.size / 5, 1); // Normalize to max 5 users
    
    return Math.min((diversityScore + participationScore) * 50, 100);
  }

  private calculateCommunicationFrequency(activities: any[]): number {
    const communicationActions = activities.filter(a => 
      a.action_type.includes('comment') || a.action_type.includes('message')
    );
    
    return communicationActions.length;
  }

  private calculateAverageResponseTime(activities: any[]): number {
    // Simplified calculation - would need more sophisticated logic for real response times
    return 2.5; // placeholder: 2.5 hours
  }

  private calculateAverageDaysEarly(deadlines: any[]): number {
    const completedDeadlines = deadlines.filter(d => d.status === 'completed');
    if (completedDeadlines.length === 0) return 0;

    // This would need more data about actual completion dates vs due dates
    return 1.5; // placeholder
  }

  private calculateDeadlineComplianceTrend(deadlines: any[]): Array<{ month: string; compliance: number }> {
    // Simplified monthly trend calculation
    const monthlyData: Record<string, { total: number; met: number }> = {};
    
    deadlines.forEach(deadline => {
      const month = new Date(deadline.created_at).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, met: 0 };
      }
      monthlyData[month].total++;
      if (deadline.status === 'completed') {
        monthlyData[month].met++;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      compliance: data.total > 0 ? (data.met / data.total) * 100 : 0
    }));
  }

  private calculateTimeByTask(timeLogs: any[]): TimeTrackingMetrics['timeByTask'] {
    const taskTimeMap: Record<string, any> = {};

    timeLogs.forEach(log => {
      const taskId = log.task_id;
      if (!taskTimeMap[taskId]) {
        taskTimeMap[taskId] = {
          taskId,
          taskTitle: log.legal_tasks?.title || 'Unknown Task',
          totalTime: 0,
          billableTime: 0,
          efficiency: 0
        };
      }

      taskTimeMap[taskId].totalTime += log.duration_minutes || 0;
      if (log.billable) {
        taskTimeMap[taskId].billableTime += log.duration_minutes || 0;
      }
    });

    // Calculate efficiency (simplified)
    Object.values(taskTimeMap).forEach((task: any) => {
      task.efficiency = task.totalTime > 0 ? (task.billableTime / task.totalTime) * 100 : 0;
    });

    return Object.values(taskTimeMap);
  }

  private calculateTimeByUser(timeLogs: any[]): TimeTrackingMetrics['timeByUser'] {
    const userTimeMap: Record<string, any> = {};

    timeLogs.forEach(log => {
      const userId = log.user_id;
      if (!userTimeMap[userId]) {
        userTimeMap[userId] = {
          userId,
          userName: `User ${userId.substring(0, 8)}`,
          totalTime: 0,
          billableTime: 0,
          averageDaily: 0
        };
      }

      userTimeMap[userId].totalTime += log.duration_minutes || 0;
      if (log.billable) {
        userTimeMap[userId].billableTime += log.duration_minutes || 0;
      }
    });

    // Calculate average daily time (simplified)
    Object.values(userTimeMap).forEach((user: any) => {
      user.averageDaily = user.totalTime / 30; // Assuming 30-day period
    });

    return Object.values(userTimeMap);
  }

  private calculateDailyTimeTrend(timeLogs: any[]): Array<{ date: string; minutes: number; billable: number }> {
    const dailyData: Record<string, { minutes: number; billable: number }> = {};

    timeLogs.forEach(log => {
      const date = new Date(log.start_time).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { minutes: 0, billable: 0 };
      }
      dailyData[date].minutes += log.duration_minutes || 0;
      if (log.billable) {
        dailyData[date].billable += log.duration_minutes || 0;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      billable: data.billable
    }));
  }

  private calculateSystemHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // Case progress health
    if (metrics.caseProgress.completionRate > 80) score += 25;
    else if (metrics.caseProgress.completionRate > 60) score += 20;
    else if (metrics.caseProgress.completionRate > 40) score += 15;
    else score += 10;

    // Document health
    if (metrics.documentsProcessed.indexedFiles / metrics.documentsProcessed.totalFiles > 0.9) score += 25;
    else if (metrics.documentsProcessed.indexedFiles / metrics.documentsProcessed.totalFiles > 0.7) score += 20;
    else score += 15;

    // Deadline health
    if (metrics.deadlinesUpcoming.complianceRate > 90) score += 25;
    else if (metrics.deadlinesUpcoming.complianceRate > 75) score += 20;
    else if (metrics.deadlinesUpcoming.complianceRate > 60) score += 15;
    else score += 10;

    // Team activity health
    if (metrics.teamActivity.activeUsers >= metrics.teamActivity.totalUsers * 0.8) score += 25;
    else if (metrics.teamActivity.activeUsers >= metrics.teamActivity.totalUsers * 0.6) score += 20;
    else score += 15;

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private async getRecentSearchCount(projectId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count } = await supabaseClient
      .from('recent_searches')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('searched_at', sevenDaysAgo.toISOString());

    return count || 0;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;