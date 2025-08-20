-- Legal Case Management Tables

-- Legal Cases table
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL,
    case_title TEXT NOT NULL,
    case_type TEXT NOT NULL CHECK (case_type IN ('civil', 'criminal', 'family', 'corporate', 'immigration', 'other')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending', 'on_hold')),
    court_name TEXT,
    judge_name TEXT,
    filing_date DATE,
    trial_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Legal Contacts table
CREATE TABLE IF NOT EXISTS legal_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'opposing_counsel', 'witness', 'expert', 'judge', 'court_staff', 'other')),
    email TEXT,
    phone TEXT,
    address TEXT,
    organization TEXT,
    bar_number TEXT,
    specialty TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Legal Tasks table
CREATE TABLE IF NOT EXISTS legal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('filing', 'discovery', 'research', 'meeting', 'court_appearance', 'deadline', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to TEXT,
    due_date DATE,
    completion_date TIMESTAMP WITH TIME ZONE,
    related_contact_id UUID REFERENCES legal_contacts(id) ON DELETE SET NULL,
    related_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Legal Notes table
CREATE TABLE IF NOT EXISTS legal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('discovery', 'meeting', 'research', 'strategy', 'client_communication', 'court_notes', 'other')),
    tags TEXT[],
    related_contact_id UUID REFERENCES legal_contacts(id) ON DELETE SET NULL,
    related_task_id UUID REFERENCES legal_tasks(id) ON DELETE SET NULL,
    related_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Legal Timeline table
CREATE TABLE IF NOT EXISTS legal_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('filing', 'hearing', 'deadline', 'discovery', 'settlement', 'trial', 'appeal', 'other')),
    event_date DATE NOT NULL,
    is_deadline BOOLEAN DEFAULT FALSE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    related_task_id UUID REFERENCES legal_tasks(id) ON DELETE SET NULL,
    related_contact_id UUID REFERENCES legal_contacts(id) ON DELETE SET NULL,
    related_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Evidence Records table
CREATE TABLE IF NOT EXISTS evidence_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    exhibit_number TEXT NOT NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('document', 'photo', 'video', 'audio', 'physical', 'digital', 'other')),
    description TEXT,
    is_privileged BOOLEAN DEFAULT FALSE NOT NULL,
    is_work_product BOOLEAN DEFAULT FALSE NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(project_id, exhibit_number)
);

-- Chain of Custody table
CREATE TABLE IF NOT EXISTS chain_of_custody (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('received', 'transferred', 'analyzed', 'copied', 'returned', 'destroyed')),
    person_name TEXT NOT NULL,
    person_role TEXT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    notes TEXT,
    signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Legal Deadlines table
CREATE TABLE IF NOT EXISTS legal_deadlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline_type TEXT NOT NULL CHECK (deadline_type IN ('court_filing', 'discovery', 'statute_of_limitations', 'appeal', 'response', 'other')),
    due_date DATE NOT NULL,
    reminder_dates DATE[],
    is_critical BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'extended')),
    related_task_id UUID REFERENCES legal_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Document Templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('motion', 'discovery_request', 'correspondence', 'pleading', 'brief', 'contract', 'other')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legal_cases_project_id ON legal_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_type ON legal_cases(case_type);

CREATE INDEX IF NOT EXISTS idx_legal_contacts_project_id ON legal_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_contacts_role ON legal_contacts(role);
CREATE INDEX IF NOT EXISTS idx_legal_contacts_name ON legal_contacts(name);

CREATE INDEX IF NOT EXISTS idx_legal_tasks_project_id ON legal_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_status ON legal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_priority ON legal_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_legal_tasks_due_date ON legal_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_legal_notes_project_id ON legal_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_notes_category ON legal_notes(category);
CREATE INDEX IF NOT EXISTS idx_legal_notes_tags ON legal_notes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_legal_timeline_project_id ON legal_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_timeline_event_date ON legal_timeline(event_date);
CREATE INDEX IF NOT EXISTS idx_legal_timeline_event_type ON legal_timeline(event_type);

CREATE INDEX IF NOT EXISTS idx_evidence_records_project_id ON evidence_records(project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_records_file_id ON evidence_records(file_id);
CREATE INDEX IF NOT EXISTS idx_evidence_records_exhibit_number ON evidence_records(exhibit_number);

CREATE INDEX IF NOT EXISTS idx_chain_of_custody_evidence_id ON chain_of_custody(evidence_id);
CREATE INDEX IF NOT EXISTS idx_chain_of_custody_date_time ON chain_of_custody(date_time);

CREATE INDEX IF NOT EXISTS idx_legal_deadlines_project_id ON legal_deadlines(project_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_due_date ON legal_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_status ON legal_deadlines(status);

CREATE INDEX IF NOT EXISTS idx_document_templates_template_type ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_system ON document_templates(is_system);

-- Enable RLS on all tables
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Legal Cases
CREATE POLICY "Users can view legal cases they own or have access to"
    ON legal_cases FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal cases in their projects"
    ON legal_cases FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal cases they own or have editor access"
    ON legal_cases FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal cases they own"
    ON legal_cases FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Legal Contacts
CREATE POLICY "Users can view legal contacts they own or have access to"
    ON legal_contacts FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal contacts in their projects"
    ON legal_contacts FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal contacts they own or have editor access"
    ON legal_contacts FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal contacts they own"
    ON legal_contacts FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Legal Tasks
CREATE POLICY "Users can view legal tasks they own or have access to"
    ON legal_tasks FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal tasks in their projects"
    ON legal_tasks FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal tasks they own or have editor access"
    ON legal_tasks FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal tasks they own"
    ON legal_tasks FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Legal Notes
CREATE POLICY "Users can view legal notes they own or have access to"
    ON legal_notes FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal notes in their projects"
    ON legal_notes FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal notes they own or have editor access"
    ON legal_notes FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal notes they own"
    ON legal_notes FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Legal Timeline
CREATE POLICY "Users can view legal timeline they own or have access to"
    ON legal_timeline FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal timeline in their projects"
    ON legal_timeline FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal timeline they own or have editor access"
    ON legal_timeline FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal timeline they own"
    ON legal_timeline FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Evidence Records
CREATE POLICY "Users can view evidence records they own or have access to"
    ON evidence_records FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert evidence records in their projects"
    ON evidence_records FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update evidence records they own or have editor access"
    ON evidence_records FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete evidence records they own"
    ON evidence_records FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Chain of Custody
CREATE POLICY "Users can view chain of custody for evidence they have access to"
    ON chain_of_custody FOR SELECT
    USING (
        evidence_id IN (
            SELECT er.id FROM evidence_records er
            JOIN projects p ON er.project_id = p.id
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE (er.owner_id = auth.uid() OR p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert chain of custody for evidence they have access to"
    ON chain_of_custody FOR INSERT
    WITH CHECK (
        evidence_id IN (
            SELECT er.id FROM evidence_records er
            JOIN projects p ON er.project_id = p.id
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE (er.owner_id = auth.uid() OR p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update chain of custody for evidence they own"
    ON chain_of_custody FOR UPDATE
    USING (
        evidence_id IN (
            SELECT er.id FROM evidence_records er
            WHERE er.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chain of custody for evidence they own"
    ON chain_of_custody FOR DELETE
    USING (
        evidence_id IN (
            SELECT er.id FROM evidence_records er
            WHERE er.owner_id = auth.uid()
        )
    );

-- RLS Policies for Legal Deadlines
CREATE POLICY "Users can view legal deadlines they own or have access to"
    ON legal_deadlines FOR SELECT
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR pc.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert legal deadlines in their projects"
    ON legal_deadlines FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can update legal deadlines they own or have editor access"
    ON legal_deadlines FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM projects p 
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
            WHERE (p.owner_id = auth.uid() OR (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor')))
        )
    );

CREATE POLICY "Users can delete legal deadlines they own"
    ON legal_deadlines FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for Document Templates
CREATE POLICY "Users can view document templates they own or system templates"
    ON document_templates FOR SELECT
    USING (owner_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can insert their own document templates"
    ON document_templates FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update document templates they own"
    ON document_templates FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete document templates they own (except system templates)"
    ON document_templates FOR DELETE
    USING (owner_id = auth.uid() AND is_system = false);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legal_cases_updated_at BEFORE UPDATE ON legal_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_contacts_updated_at BEFORE UPDATE ON legal_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_tasks_updated_at BEFORE UPDATE ON legal_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_notes_updated_at BEFORE UPDATE ON legal_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_timeline_updated_at BEFORE UPDATE ON legal_timeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_records_updated_at BEFORE UPDATE ON evidence_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_deadlines_updated_at BEFORE UPDATE ON legal_deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();