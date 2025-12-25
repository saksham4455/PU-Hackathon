// Backend API service to replace localStorage functionality
export type Profile = {
  id: string;
  full_name: string;
  role: 'citizen' | 'admin';
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'citizen' | 'admin';
  created_at: string;
  updated_at: string;
  // Gamification fields
  reputation_points?: number;
  badges?: string[];
  issues_reported?: number;
  issues_resolved?: number;
  // Profile fields
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
};

export type IssueComment = {
  id: string;
  issue_id: string;
  author_type: 'admin' | 'citizen';
  author_id: string;
  author_name: string;
  comment: string;
  created_at: string;
};

export type IssueStatusHistory = {
  id: string;
  issue_id: string;
  old_status: 'pending' | 'in_progress' | 'resolved';
  new_status: 'pending' | 'in_progress' | 'resolved';
  changed_by: string; // user_id who made the change
  changed_by_name: string; // name of the person who made the change
  changed_at: string;
  comment?: string; // optional comment about the status change
};

export type Issue = {
  id: string;
  user_id: string;
  issue_type: 'pothole' | 'garbage' | 'streetlight' | 'water_leak' | 'broken_sidewalk' | 'traffic_signal' | 'street_sign' | 'drainage' | 'tree_maintenance' | 'graffiti' | 'noise_complaint' | 'parking_violation' | 'other';
  description: string;
  photo_url?: string;
  photos?: string[]; // Multiple photos support
  video_url?: string; // Video support
  voice_note_url?: string; // Voice note support
  priority: 'low' | 'medium' | 'high' | 'critical'; // Priority levels
  latitude: number;
  longitude: number;
  location_address?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_notes?: string;
  public_comments?: IssueComment[]; // Public comments visible to citizens
  status_history?: IssueStatusHistory[]; // Track all status changes
  is_anonymous?: boolean; // Anonymous reporting
  anonymous_email?: string; // Email for anonymous reports
  created_at: string;
  updated_at: string;
};

// Backend API service
class BackendAPIService {
  private baseURL = '/api';

  // User management
  async createUser(email: string, password: string, fullName: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      console.log('Attempting to create user:', email);
      console.log('API URL:', `${this.baseURL}/users`);

      const response = await fetch(`${this.baseURL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to create user') };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Create user error:', error);
      return { user: null, error: error as Error };
    }
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      console.log('Attempting to authenticate user:', email);
      console.log('API URL:', `${this.baseURL}/auth/login`);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Authentication failed') };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Authentication error:', error);
      return { user: null, error: error as Error };
    }
  }

  async updateUserProfile(userId: string, updates: { full_name?: string; email?: string }): Promise<{ user: User | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to update profile') };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async getUsers(): Promise<{ users: User[]; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/users`);
      const data = await response.json();

      if (!response.ok) {
        return { users: [], error: new Error(data.error || 'Failed to fetch users') };
      }

      return { users: data.users, error: null };
    } catch (error) {
      return { users: [], error: error as Error };
    }
  }

  async getUser(userId: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to get user') };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: new Error(data.error || 'Failed to update user') };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // Issue management
  async createIssue(issueData: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<{ issue: Issue | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { issue: null, error: new Error(data.error || 'Failed to create issue') };
      }

      return { issue: data.issue, error: null };
    } catch (error) {
      return { issue: null, error: error as Error };
    }
  }

  async getIssues(): Promise<{ issues: Issue[]; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues`);
      const data = await response.json();

      if (!response.ok) {
        return { issues: [], error: new Error(data.error || 'Failed to fetch issues') };
      }

      return { issues: data.issues, error: null };
    } catch (error) {
      return { issues: [], error: error as Error };
    }
  }

  async getUserIssues(userId: string): Promise<{ issues: Issue[]; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}/issues`);
      const data = await response.json();

      if (!response.ok) {
        return { issues: [], error: new Error(data.error || 'Failed to fetch user issues') };
      }

      return { issues: data.issues, error: null };
    } catch (error) {
      return { issues: [], error: error as Error };
    }
  }

  async updateIssueStatus(issueId: string, status: Issue['status'], changedBy?: string, changedByName?: string, comment?: string): Promise<{ issue: Issue | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          changed_by: changedBy,
          changed_by_name: changedByName,
          comment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { issue: null, error: new Error(data.error || 'Failed to update issue') };
      }

      return { issue: data.issue, error: null };
    } catch (error) {
      return { issue: null, error: error as Error };
    }
  }

  async updateIssueAdminNotes(issueId: string, adminNotes: string): Promise<{ issue: Issue | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues/${issueId}/admin-notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { issue: null, error: new Error(data.error || 'Failed to update admin notes') };
      }

      return { issue: data.issue, error: null };
    } catch (error) {
      return { issue: null, error: error as Error };
    }
  }

  async getIssueById(issueId: string): Promise<{ issue: Issue | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues/${issueId}`);
      const data = await response.json();

      if (!response.ok) {
        return { issue: null, error: new Error(data.error || 'Failed to fetch issue') };
      }

      return { issue: data.issue, error: null };
    } catch (error) {
      return { issue: null, error: error as Error };
    }
  }

  async addPublicComment(issueId: string, comment: string, authorType: 'admin' | 'citizen', authorId: string, authorName: string): Promise<{ comment: IssueComment | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseURL}/issues/${issueId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment,
          author_type: authorType,
          author_id: authorId,
          author_name: authorName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { comment: null, error: new Error(data.error || 'Failed to add comment') };
      }

      return { comment: data.comment, error: null };
    } catch (error) {
      return { comment: null, error: error as Error };
    }
  }

  async exportAllData(): Promise<void> {
    try {
      // Get all issues
      const { issues } = await this.getIssues();

      // Create downloadable JSON files
      const issuesBlob = new Blob([JSON.stringify(issues, null, 2)], { type: 'application/json' });
      const issuesUrl = URL.createObjectURL(issuesBlob);

      // Create download link
      const link = document.createElement('a');
      link.href = issuesUrl;
      link.download = `issues-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(issuesUrl);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  async exportToCSV(): Promise<void> {
    try {
      const { issues } = await this.getIssues();

      // Create CSV headers
      const headers = [
        'ID',
        'Issue Type',
        'Description',
        'Priority',
        'Status',
        'Location Address',
        'Latitude',
        'Longitude',
        'Created At',
        'Updated At',
        'Is Anonymous',
        'Admin Notes'
      ];

      // Convert issues to CSV rows
      const csvRows = issues.map(issue => [
        issue.id,
        issue.issue_type,
        `"${issue.description.replace(/"/g, '""')}"`, // Escape quotes
        issue.priority || 'medium',
        issue.status,
        `"${issue.location_address || ''}"`,
        issue.latitude,
        issue.longitude,
        issue.created_at,
        issue.updated_at,
        issue.is_anonymous ? 'Yes' : 'No',
        `"${(issue.admin_notes || '').replace(/"/g, '""')}"`
      ]);

      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `issues-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  }

  async exportToPDF(): Promise<void> {
    try {
      const { issues } = await this.getIssues();

      // Create a simple HTML table for PDF generation
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Issues Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-pending { color: #dc3545; }
            .status-in-progress { color: #ffc107; }
            .status-resolved { color: #28a745; }
            .priority-critical { color: #dc3545; font-weight: bold; }
            .priority-high { color: #fd7e14; }
            .priority-medium { color: #ffc107; }
            .priority-low { color: #28a745; }
          </style>
        </head>
        <body>
          <h1>City Issues Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Issues: ${issues.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Location</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(issue => `
                <tr>
                  <td>${issue.id.slice(0, 8)}...</td>
                  <td>${issue.issue_type.replace('_', ' ')}</td>
                  <td>${issue.description.substring(0, 50)}${issue.description.length > 50 ? '...' : ''}</td>
                  <td class="priority-${issue.priority || 'medium'}">${(issue.priority || 'medium').toUpperCase()}</td>
                  <td class="status-${issue.status}">${issue.status.replace('_', ' ').toUpperCase()}</td>
                  <td>${issue.location_address || 'N/A'}</td>
                  <td>${new Date(issue.created_at).toLocaleDateString()}</td>
                  <td>${new Date(issue.updated_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and print the content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  }

  // File upload function for local server
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.url || data.fileUrl || `/uploads/${data.filename}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export const localStorageService = new BackendAPIService();