-- ============================================================
-- PeakValley (峰谷算力) 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- ─── 1. organizations 组织表 ───
CREATE TABLE IF NOT EXISTS public.organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (type IN ('university', 'company', 'personal')),
    quota_limit DECIMAL(12,2) DEFAULT 10000.00,
    pricing_tier VARCHAR(20) DEFAULT 'standard',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. users 用户表 ───
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    role        VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'enterprise', 'admin')),
    org_id      UUID REFERENCES public.organizations(id),
    balance     DECIMAL(12,4) DEFAULT 10.0000,  -- 注册赠送 10 元
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. api_keys API 密钥表 ───
CREATE TABLE IF NOT EXISTS public.api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key_hash    VARCHAR(64) NOT NULL,            -- SHA256 哈希
    prefix      VARCHAR(12) NOT NULL,             -- pv-xxxx 前缀用于识别
    name        VARCHAR(100) DEFAULT 'Default Key',
    rate_limit  INT DEFAULT 60,                   -- RPM
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

-- ─── 4. usage_logs 用量日志 (高频写入) ───
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id),
    model               VARCHAR(100) NOT NULL,
    provider            VARCHAR(50) NOT NULL,
    prompt_tokens       INT DEFAULT 0,
    completion_tokens   INT DEFAULT 0,
    price_tier          VARCHAR(20) NOT NULL DEFAULT 'standard',
    unit_price          DECIMAL(10,6) DEFAULT 0,
    cost                DECIMAL(10,6) DEFAULT 0,      -- 成本价
    sell_price          DECIMAL(10,6) DEFAULT 0,      -- 售价
    latency_ms          INT,
    status              VARCHAR(20) DEFAULT 'success',
    error_message       TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. billing_records 账单 (T+1 汇总) ───
CREATE TABLE IF NOT EXISTS public.billing_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    total_tokens    INT DEFAULT 0,
    total_cost      DECIMAL(12,4) DEFAULT 0,
    peak_cost       DECIMAL(12,4) DEFAULT 0,
    valley_cost     DECIMAL(12,4) DEFAULT 0,
    standard_cost   DECIMAL(12,4) DEFAULT 0,
    sell_price      DECIMAL(12,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. pricing_rules 定价规则 ───
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier            VARCHAR(20) NOT NULL CHECK (tier IN ('peak', 'valley', 'standard')),
    hour_start      INT NOT NULL CHECK (hour_start BETWEEN 0 AND 23),
    hour_end        INT NOT NULL CHECK (hour_end BETWEEN 0 AND 23),
    multiplier      DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    model_pattern   VARCHAR(200) DEFAULT '%',       -- 模型匹配规则，% 为通配
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. provider_configs 供应商配置 ───
CREATE TABLE IF NOT EXISTS public.provider_configs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider            VARCHAR(50) NOT NULL,
    model_name          VARCHAR(100) NOT NULL,
    base_url            VARCHAR(500) NOT NULL,
    cost_per_1k_input   DECIMAL(10,6) NOT NULL,
    cost_per_1k_output  DECIMAL(10,6) NOT NULL,
    sell_multiplier     DECIMAL(4,2) DEFAULT 1.0,
    is_active           BOOLEAN DEFAULT true,
    priority            INT DEFAULT 99,
    created_at          TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 索引优化
-- ============================================================

-- usage_logs 高频查询索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_price_tier ON public.usage_logs(price_tier);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON public.usage_logs(user_id, created_at);

-- api_keys 查询索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(prefix);

-- billing_records 查询索引
CREATE INDEX IF NOT EXISTS idx_billing_user_period ON public.billing_records(user_id, period_start DESC);

-- provider_configs
CREATE INDEX IF NOT EXISTS idx_provider_active ON public.provider_configs(is_active, priority);


-- ============================================================
-- RLS (Row Level Security) - 多租户数据隔离
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的数据
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own API keys"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own billing records"
    ON public.billing_records FOR SELECT
    USING (auth.uid() = user_id);

-- 管理员可看所有数据 (通过 service_role key 绕过 RLS)


-- ============================================================
-- 种子数据 - 默认峰谷定价规则
-- ============================================================

INSERT INTO public.pricing_rules (tier, hour_start, hour_end, multiplier, model_pattern) VALUES
-- 谷段: 22:00 - 08:00 (跨午夜分两段)
('valley',    22, 23, 0.50, '%'),
('valley',     0,  7, 0.50, '%'),
-- 峰段: 10:00 - 18:00
('peak',      10, 17, 1.30, '%'),
-- 平段: 08:00-10:00, 18:00-22:00
('standard',   8,  9, 1.00, '%'),
('standard',  18, 21, 1.00, '%');

-- 种子数据 - 默认供应商配置
INSERT INTO public.provider_configs (provider, model_name, base_url, cost_per_1k_input, cost_per_1k_output, sell_multiplier, priority) VALUES
('deepseek', 'deepseek-chat',     'https://api.deepseek.com',                            0.001000, 0.002000, 1.0, 1),
('deepseek', 'deepseek-reasoner', 'https://api.deepseek.com',                            0.004000, 0.016000, 1.0, 2),
('qwen',     'qwen-plus',         'https://dashscope.aliyuncs.com/compatible-mode/v1',   0.000800, 0.002000, 1.0, 3),
('qwen',     'qwen-turbo',        'https://dashscope.aliyuncs.com/compatible-mode/v1',   0.000300, 0.000600, 1.0, 4),
('zhipu',    'glm-4-flash',       'https://open.bigmodel.cn/api/paas/v4',                0.000100, 0.000100, 1.0, 5),
('zhipu',    'glm-4-plus',        'https://open.bigmodel.cn/api/paas/v4',                0.050000, 0.050000, 1.0, 6);


-- ============================================================
-- 触发器 - 新用户注册时自动创建 users 记录
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, balance)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        10.0000
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 视图 - 管理后台统计
-- ============================================================

CREATE OR REPLACE VIEW public.v_daily_stats AS
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_requests,
    SUM(prompt_tokens + completion_tokens) AS total_tokens,
    SUM(cost) AS total_cost,
    SUM(sell_price) AS total_revenue,
    SUM(sell_price - cost) AS profit,
    COUNT(*) FILTER (WHERE price_tier = 'peak') AS peak_requests,
    COUNT(*) FILTER (WHERE price_tier = 'valley') AS valley_requests,
    COUNT(*) FILTER (WHERE price_tier = 'standard') AS standard_requests
FROM public.usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
