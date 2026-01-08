import api from './api';

export interface TeamMember {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  role: 'owner' | 'admin' | 'viewer';
  status: 'pending' | 'active' | 'declined';
  invited_at: string;
  joined_at?: string;
  invited_by_name: string;
}

export interface Invitation {
  id: number;
  role: 'owner' | 'admin' | 'viewer';
  invited_at: string;
  subdomain: string;
  port: number;
  invited_by_name: string;
  invited_by_email: string;
}

export interface WorkflowComment {
  id: number;
  workflow_id: string;
  workflow_name: string;
  comment: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
}

export const teamService = {
  // Team management
  async inviteMember(email: string, role: 'admin' | 'viewer'): Promise<void> {
    await api.post('/team/invite', { email, role });
  },

  async getMembers(): Promise<TeamMember[]> {
    const response = await api.get('/team/members');
    return response.data.data;
  },

  async updateMemberRole(memberId: number, role: 'admin' | 'viewer'): Promise<void> {
    await api.put(`/team/members/${memberId}/role`, { role });
  },

  async removeMember(memberId: number): Promise<void> {
    await api.delete(`/team/members/${memberId}`);
  },

  // Invitations
  async getInvitations(): Promise<Invitation[]> {
    const response = await api.get('/team/invitations');
    return response.data.data;
  },

  async acceptInvitation(memberId: number): Promise<void> {
    await api.post(`/team/invitations/${memberId}/accept`);
  },

  async declineInvitation(memberId: number): Promise<void> {
    await api.post(`/team/invitations/${memberId}/decline`);
  },

  // Comments
  async addComment(
    workflowId: string,
    workflowName: string,
    comment: string,
    parentId?: number
  ): Promise<void> {
    await api.post('/comments', { workflowId, workflowName, comment, parentId });
  },

  async getWorkflowComments(workflowId: string): Promise<WorkflowComment[]> {
    const response = await api.get(`/comments/workflow/${workflowId}`);
    return response.data.data;
  },

  async getAllComments(): Promise<WorkflowComment[]> {
    const response = await api.get('/comments');
    return response.data.data;
  },

  async getRecentComments(limit: number = 10): Promise<WorkflowComment[]> {
    const response = await api.get(`/comments/recent?limit=${limit}`);
    return response.data.data;
  },

  async updateComment(commentId: number, comment: string): Promise<void> {
    await api.put(`/comments/${commentId}`, { comment });
  },

  async deleteComment(commentId: number): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  }
};
