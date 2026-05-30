import { supabase } from '../lib/supabase';

export interface SharedDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  status: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecipient {
  id: string;
  document_id: string;
  employee_id: string;
  created_at: string;
}

export interface DocumentRead {
  id: string;
  document_id: string;
  employee_id: string;
  read_at: string;
}

export interface DocumentWithStats extends SharedDocument {
  recipients: { employee_id: string; name: string; email: string }[];
  reads: { employee_id: string; read_at: string }[];
  total_recipients: number;
  total_reads: number;
}

export const documentService = {
  async uploadDocument(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async createDocument(
    title: string,
    description: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    recipientIds: string[]
  ): Promise<SharedDocument> {
    const { data: doc, error: docError } = await supabase
      .from('shared_documents')
      .insert({
        title,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        status: 0
      })
      .select()
      .single();

    if (docError) throw docError;

    if (recipientIds.length > 0) {
      const recipients = recipientIds.map(employeeId => ({
        document_id: doc.id,
        employee_id: employeeId
      }));

      const { error: recipError } = await supabase
        .from('document_recipients')
        .insert(recipients);

      if (recipError) throw recipError;
    }

    return doc;
  },

  async getDocumentsForAdmin(): Promise<DocumentWithStats[]> {
    const { data, error } = await supabase
      .from('shared_documents')
      .select(`
        *,
        document_recipients (
          employee_id,
          employees (
            name,
            email,
            status
          )
        ),
        document_reads (
          employee_id,
          read_at
        )
      `)
      .eq('status', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((doc: any) => {
      const activeRecipients = doc.document_recipients.filter((r: any) =>
        r.employees && r.employees.status !== 4
      );

      return {
        ...doc,
        recipients: activeRecipients.map((r: any) => ({
          employee_id: r.employee_id,
          name: r.employees.name,
          email: r.employees.email
        })),
        reads: doc.document_reads,
        total_recipients: activeRecipients.length,
        total_reads: doc.document_reads.length
      };
    });
  },

  async getDocumentsForEmployee(employeeId: string) {
    const { data: recipients, error: recipError } = await supabase
      .from('document_recipients')
      .select('document_id')
      .eq('employee_id', employeeId);

    if (recipError) throw recipError;

    const documentIds = recipients.map(r => r.document_id);

    if (documentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('shared_documents')
      .select('*')
      .in('id', documentIds)
      .eq('status', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: reads, error: readsError } = await supabase
      .from('document_reads')
      .select('document_id')
      .eq('employee_id', employeeId)
      .in('document_id', documentIds);

    if (readsError) throw readsError;

    const readDocumentIds = reads.map(r => r.document_id);

    return data.map((doc: any) => ({
      ...doc,
      is_read: readDocumentIds.includes(doc.id)
    }));
  },

  async getUnreadCount(employeeId: string): Promise<number> {
    const { data: recipientsData, error: recipError } = await supabase
      .from('document_recipients')
      .select('document_id')
      .eq('employee_id', employeeId);

    if (recipError) throw recipError;

    const documentIds = recipientsData.map(r => r.document_id);

    if (documentIds.length === 0) return 0;

    const { data: readsData, error: readsError } = await supabase
      .from('document_reads')
      .select('document_id')
      .eq('employee_id', employeeId)
      .in('document_id', documentIds);

    if (readsError) throw readsError;

    const readDocumentIds = readsData.map(r => r.document_id);
    const unreadCount = documentIds.filter(id => !readDocumentIds.includes(id)).length;

    return unreadCount;
  },

  async markAsRead(documentId: string, employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('document_reads')
      .insert({
        document_id: documentId,
        employee_id: employeeId
      });

    if (error && !error.message.includes('duplicate key')) {
      throw error;
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('shared_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  async updateRecipients(documentId: string, recipientIds: string[]): Promise<void> {
    await supabase
      .from('document_recipients')
      .delete()
      .eq('document_id', documentId);

    if (recipientIds.length > 0) {
      const recipients = recipientIds.map(employeeId => ({
        document_id: documentId,
        employee_id: employeeId
      }));

      const { error } = await supabase
        .from('document_recipients')
        .insert(recipients);

      if (error) throw error;
    }
  }
};
