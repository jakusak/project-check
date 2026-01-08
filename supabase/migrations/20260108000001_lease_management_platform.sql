-- =====================================================
-- Lease Contract Management & Property Search Platform
-- Database Schema Migration
-- =====================================================

-- =====================================================
-- 1. EXTEND USER ROLES
-- =====================================================

-- Drop existing app_role type and recreate with new roles
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user', 'reviewer', 'signer');

-- Recreate user_roles table with new role type
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- 2. LEGAL ENTITIES
-- =====================================================

CREATE TABLE public.legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('housing', 'warehouse')),
    tax_id TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.legal_entities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CONTRACT STATES AND TYPES
-- =====================================================

CREATE TYPE public.contract_state AS ENUM (
    'draft',
    'uploaded',
    'generated',
    'ai_assessed',
    'review_required',
    'blocked',
    'approved',
    'sent_to_docusign',
    'signed',
    'archived'
);

CREATE TYPE public.contract_type AS ENUM ('housing', 'warehouse');
CREATE TYPE public.contract_seasonality AS ENUM ('seasonal', 'year_round');

-- =====================================================
-- 4. CONTRACTS TABLE
-- =====================================================

CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Metadata
    contract_number TEXT UNIQUE NOT NULL,
    contract_type contract_type NOT NULL,
    country TEXT NOT NULL,

    -- State Management
    state contract_state NOT NULL DEFAULT 'draft',
    blocked_reason TEXT,

    -- Contract Details
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    seasonality contract_seasonality NOT NULL,

    -- Legal Entity
    legal_entity_id UUID REFERENCES public.legal_entities(id),

    -- Property Reference (optional at draft)
    property_reference TEXT,

    -- Document Storage
    document_url TEXT,
    document_filename TEXT,
    document_type TEXT CHECK (document_type IN ('pdf', 'docx')),
    sharepoint_folder_url TEXT,

    -- Template Info (if generated from template)
    generated_from_template_id UUID,

    -- Ownership and Tracking
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_reviewer UUID REFERENCES auth.users(id),
    assigned_signer UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Index for common queries
CREATE INDEX idx_contracts_state ON public.contracts (state);
CREATE INDEX idx_contracts_country ON public.contracts (country);
CREATE INDEX idx_contracts_created_by ON public.contracts (created_by);
CREATE INDEX idx_contracts_assigned_reviewer ON public.contracts (assigned_reviewer);

-- =====================================================
-- 5. CONTRACT RULES ENGINE
-- =====================================================

CREATE TYPE public.rule_category AS ENUM (
    'entity_rule',
    'clause_rule',
    'duration_rule',
    'signer_rule',
    'forbidden_language'
);

CREATE TABLE public.contract_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule Definition
    rule_name TEXT NOT NULL,
    rule_category rule_category NOT NULL,
    description TEXT,

    -- Applicability
    applies_to_country TEXT,
    applies_to_contract_type contract_type,

    -- Rule Logic (stored as JSONB for flexibility)
    rule_config JSONB NOT NULL,

    -- Enforcement
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Priority (higher number = higher priority)
    priority INTEGER NOT NULL DEFAULT 0,

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contract_rules_category ON public.contract_rules (rule_category);
CREATE INDEX idx_contract_rules_country ON public.contract_rules (applies_to_country);

-- =====================================================
-- 6. CLAUSE CHECKLISTS
-- =====================================================

CREATE TABLE public.clause_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Checklist Definition
    clause_name TEXT NOT NULL,
    clause_description TEXT,

    -- Applicability
    applies_to_country TEXT,
    applies_to_contract_type contract_type,

    -- Required or Optional
    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    -- Example Language
    example_language TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clause_checklists ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CONTRACT AI ASSESSMENTS
-- =====================================================

CREATE TYPE public.assessment_status AS ENUM ('ok', 'risk', 'missing');

CREATE TABLE public.contract_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contract Reference
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,

    -- Assessment Type
    assessment_type TEXT NOT NULL,
    checklist_item_id UUID REFERENCES public.clause_checklists(id),

    -- AI Output
    status assessment_status NOT NULL,
    explanation TEXT NOT NULL,
    suggested_language TEXT,

    -- Metadata
    ai_model TEXT,
    ai_confidence DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contract_assessments_contract ON public.contract_assessments (contract_id);
CREATE INDEX idx_contract_assessments_status ON public.contract_assessments (status);

-- =====================================================
-- 8. CONTRACT REVIEWS
-- =====================================================

CREATE TYPE public.review_decision AS ENUM ('approved', 'rejected', 'needs_changes');

CREATE TABLE public.contract_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contract Reference
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,

    -- Reviewer
    reviewer_id UUID REFERENCES auth.users(id) NOT NULL,

    -- Decision
    decision review_decision NOT NULL,
    comments TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contract_reviews_contract ON public.contract_reviews (contract_id);
CREATE INDEX idx_contract_reviews_reviewer ON public.contract_reviews (reviewer_id);

-- =====================================================
-- 9. DOCUSIGN ENVELOPES
-- =====================================================

CREATE TYPE public.envelope_status AS ENUM (
    'sent',
    'delivered',
    'signed',
    'completed',
    'declined',
    'voided'
);

CREATE TABLE public.docusign_envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contract Reference
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,

    -- DocuSign Data
    envelope_id TEXT UNIQUE NOT NULL,
    status envelope_status NOT NULL,

    -- Signer Information
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,

    -- Document Links
    signed_document_url TEXT,

    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.docusign_envelopes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_docusign_envelopes_contract ON public.docusign_envelopes (contract_id);
CREATE INDEX idx_docusign_envelopes_status ON public.docusign_envelopes (status);

-- =====================================================
-- 10. PROPERTIES
-- =====================================================

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Property Details
    property_name TEXT,
    property_type TEXT NOT NULL CHECK (property_type IN ('housing', 'warehouse')),

    -- Location
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT,

    -- Details
    size_sqm DECIMAL(10,2),
    monthly_rent DECIMAL(10,2),

    -- Amenities (stored as JSONB array)
    amenities JSONB DEFAULT '[]'::JSONB,

    -- Description
    description TEXT,

    -- Links
    listing_url TEXT,
    sharepoint_folder_url TEXT,

    -- Status
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_properties_type ON public.properties (property_type);
CREATE INDEX idx_properties_country ON public.properties (country);
CREATE INDEX idx_properties_city ON public.properties (city);

-- =====================================================
-- 11. PROPERTY SEARCH CASES
-- =====================================================

CREATE TYPE public.search_case_status AS ENUM (
    'active',
    'paused',
    'completed',
    'cancelled'
);

CREATE TABLE public.property_search_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Case Details
    case_name TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('housing', 'warehouse')),

    -- Location Criteria
    locations JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of {country, city}

    -- Requirements (stored as JSONB)
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    size_min_sqm DECIMAL(10,2),
    size_max_sqm DECIMAL(10,2),
    required_amenities JSONB DEFAULT '[]'::JSONB,
    duration_months INTEGER,

    -- Execution Schedule
    run_frequency TEXT CHECK (run_frequency IN ('daily', 'weekly', 'bi_weekly', 'monthly')),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    end_date DATE,

    -- Status
    status search_case_status NOT NULL DEFAULT 'active',

    -- SharePoint Integration
    sharepoint_folder_url TEXT,

    -- Ownership
    created_by UUID REFERENCES auth.users(id) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.property_search_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_search_cases_status ON public.property_search_cases (status);
CREATE INDEX idx_search_cases_created_by ON public.property_search_cases (created_by);

-- =====================================================
-- 12. PROPERTY SEARCH RESULTS
-- =====================================================

CREATE TABLE public.property_search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Search Case Reference
    search_case_id UUID REFERENCES public.property_search_cases(id) ON DELETE CASCADE NOT NULL,

    -- Property Reference (optional - may not exist in our DB yet)
    property_id UUID REFERENCES public.properties(id),

    -- External Property Data (if not in our DB)
    external_property_data JSONB,

    -- Relevance Score (from search engine)
    relevance_score DECIMAL(3,2),

    -- Source Information
    data_source TEXT NOT NULL,
    source_url TEXT,

    -- Status
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    found_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.property_search_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_search_results_case ON public.property_search_results (search_case_id);
CREATE INDEX idx_search_results_score ON public.property_search_results (relevance_score);

-- =====================================================
-- 13. AUDIT LOGS
-- =====================================================

CREATE TABLE public.lease_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entity Information
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,

    -- Action Details
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,

    -- User Information
    user_id UUID REFERENCES auth.users(id),
    user_role app_role,

    -- Additional Context
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lease_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_logs_entity ON public.lease_audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.lease_audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON public.lease_audit_logs (created_at);

-- =====================================================
-- 14. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Legal Entities: Admins and Super Admins can manage, everyone can view
CREATE POLICY "Everyone can view legal entities"
ON public.legal_entities FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage legal entities"
ON public.legal_entities FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Contracts: Users can view their own, Reviewers/Admins can view all
CREATE POLICY "Users can view their own contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (
    created_by = auth.uid() OR
    assigned_reviewer = auth.uid() OR
    assigned_signer = auth.uid() OR
    public.has_role(auth.uid(), 'reviewer') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Users can create contracts"
ON public.contracts FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Contract creators can update their drafts"
ON public.contracts FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid() AND state = 'draft'
);

CREATE POLICY "Reviewers and admins can update contracts"
ON public.contracts FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'reviewer') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Contract Rules: Admins can manage, everyone can view
CREATE POLICY "Everyone can view active rules"
ON public.contract_rules FOR SELECT
TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Admins can manage rules"
ON public.contract_rules FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Clause Checklists: Similar to rules
CREATE POLICY "Everyone can view active checklists"
ON public.clause_checklists FOR SELECT
TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Admins can manage checklists"
ON public.clause_checklists FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Contract Assessments: Linked to contract visibility
CREATE POLICY "Users can view assessments for their contracts"
ON public.contract_assessments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contracts
        WHERE id = contract_id AND (
            created_by = auth.uid() OR
            assigned_reviewer = auth.uid() OR
            assigned_signer = auth.uid() OR
            public.has_role(auth.uid(), 'reviewer') OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'super_admin')
        )
    )
);

CREATE POLICY "System can create assessments"
ON public.contract_assessments FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- Contract Reviews: Reviewers can create, linked to contract visibility
CREATE POLICY "Users can view reviews for their contracts"
ON public.contract_reviews FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contracts
        WHERE id = contract_id AND (
            created_by = auth.uid() OR
            assigned_reviewer = auth.uid() OR
            public.has_role(auth.uid(), 'reviewer') OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'super_admin')
        )
    )
);

CREATE POLICY "Reviewers can create reviews"
ON public.contract_reviews FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'reviewer') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- DocuSign Envelopes: Linked to contract visibility
CREATE POLICY "Users can view envelopes for their contracts"
ON public.docusign_envelopes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contracts
        WHERE id = contract_id AND (
            created_by = auth.uid() OR
            assigned_signer = auth.uid() OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'super_admin')
        )
    )
);

CREATE POLICY "System can manage envelopes"
ON public.docusign_envelopes FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Properties: Everyone can view
CREATE POLICY "Everyone can view properties"
ON public.properties FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage properties"
ON public.properties FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

-- Property Search Cases: Users can view their own, admins can view all
CREATE POLICY "Users can view their own search cases"
ON public.property_search_cases FOR SELECT
TO authenticated
USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Users can create search cases"
ON public.property_search_cases FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own search cases"
ON public.property_search_cases FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Property Search Results: Linked to search case visibility
CREATE POLICY "Users can view results for their search cases"
ON public.property_search_results FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.property_search_cases
        WHERE id = search_case_id AND (
            created_by = auth.uid() OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'super_admin')
        )
    )
);

CREATE POLICY "System can create search results"
ON public.property_search_results FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Users can update search results"
ON public.property_search_results FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.property_search_cases
        WHERE id = search_case_id AND (
            created_by = auth.uid() OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'super_admin')
        )
    )
);

-- Audit Logs: Admins can view all
CREATE POLICY "Admins can view audit logs"
ON public.lease_audit_logs FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "System can create audit logs"
ON public.lease_audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- =====================================================
-- 15. HELPER FUNCTIONS
-- =====================================================

-- Function to generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YY');

    SELECT COUNT(*) + 1 INTO next_num
    FROM public.contracts
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

    RETURN 'CON-' || year_suffix || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Function to log contract state changes
CREATE OR REPLACE FUNCTION public.log_contract_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.state IS DISTINCT FROM NEW.state THEN
        INSERT INTO public.lease_audit_logs (
            entity_type,
            entity_id,
            action,
            old_value,
            new_value,
            user_id
        ) VALUES (
            'contract',
            NEW.id,
            'state_change',
            jsonb_build_object('state', OLD.state),
            jsonb_build_object('state', NEW.state),
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for contract state changes
CREATE TRIGGER contract_state_change_trigger
AFTER UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.log_contract_state_change();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_entities_updated_at
BEFORE UPDATE ON public.legal_entities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_rules_updated_at
BEFORE UPDATE ON public.contract_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clause_checklists_updated_at
BEFORE UPDATE ON public.clause_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_cases_updated_at
BEFORE UPDATE ON public.property_search_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 16. SEED DATA (Optional - for testing)
-- =====================================================

-- Insert sample legal entities
INSERT INTO public.legal_entities (name, country, entity_type) VALUES
    ('Backroads Europe GmbH', 'Germany', 'housing'),
    ('Backroads France SARL', 'France', 'housing'),
    ('Backroads Italia SRL', 'Italy', 'warehouse'),
    ('Backroads España SL', 'Spain', 'housing');

-- Insert sample clause checklists
INSERT INTO public.clause_checklists (
    clause_name,
    clause_description,
    applies_to_country,
    applies_to_contract_type,
    is_required
) VALUES
    ('Termination Clause', 'Clear termination conditions and notice period', NULL, 'housing', TRUE),
    ('Tax Responsibility', 'Explicit statement of tax responsibilities', NULL, NULL, TRUE),
    ('Utility Payments', 'Clear definition of utility payment responsibilities', NULL, 'housing', TRUE),
    ('Maintenance Obligations', 'Maintenance and repair obligations', NULL, NULL, TRUE),
    ('Insurance Requirements', 'Required insurance coverage', NULL, 'warehouse', TRUE),
    ('Security Deposit', 'Security deposit amount and return conditions', NULL, 'housing', TRUE);

-- Insert sample contract rules
INSERT INTO public.contract_rules (
    rule_name,
    rule_category,
    description,
    applies_to_country,
    applies_to_contract_type,
    rule_config,
    is_mandatory
) VALUES
    (
        'Germany Entity Rule',
        'entity_rule',
        'German contracts must use Backroads Europe GmbH',
        'Germany',
        NULL,
        '{"required_entity": "Backroads Europe GmbH"}',
        TRUE
    ),
    (
        'Long Duration Approval',
        'duration_rule',
        'Contracts over 12 months require admin approval',
        NULL,
        NULL,
        '{"max_months_without_approval": 12}',
        TRUE
    ),
    (
        'Housing Tax Clause',
        'clause_rule',
        'Housing contracts must include tax responsibility clause',
        NULL,
        'housing',
        '{"required_clauses": ["tax_responsibility"]}',
        TRUE
    );

COMMENT ON TABLE public.contracts IS 'Core contracts table with state management';
COMMENT ON TABLE public.legal_entities IS 'Legal entities for contract signing';
COMMENT ON TABLE public.contract_rules IS 'Deterministic rules engine';
COMMENT ON TABLE public.clause_checklists IS 'Required and optional clauses for AI assessment';
COMMENT ON TABLE public.property_search_cases IS 'Property search cases with external agent execution';
