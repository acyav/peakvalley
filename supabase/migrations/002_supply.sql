-- ============================================================
-- PeakValley 供给端数据库扩展
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- ─── supply_accounts 供给方收益账户 ───
CREATE TABLE IF NOT EXISTS public.supply_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    total_earned        DECIMAL(12,4) DEFAULT 0,        -- 累计总收益
    available_balance   DECIMAL(12,4) DEFAULT 0,        -- 可提现余额
    pending_withdrawal  DECIMAL(12,4) DEFAULT 0,        -- 提现中金额
    withdrawn           DECIMAL(12,4) DEFAULT 0,        -- 已提现金额
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── supply_earnings 每日收益明细 ───
CREATE TABLE IF NOT EXISTS public.supply_earnings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id),
    date                DATE NOT NULL,
    tokens_served       INT DEFAULT 0,                  -- 当日服务 token 数
    earned              DECIMAL(12,4) DEFAULT 0,        -- 当日收益
    peak_earned         DECIMAL(12,4) DEFAULT 0,        -- 峰时收益
    valley_earned       DECIMAL(12,4) DEFAULT 0,        -- 谷时收益
    standard_earned     DECIMAL(12,4) DEFAULT 0,        -- 平时收益
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- ─── supply_nodes 供给节点 ───
CREATE TABLE IF NOT EXISTS public.supply_nodes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id),
    name                VARCHAR(100) DEFAULT '未命名节点',
    gpu_model           VARCHAR(100) DEFAULT 'unknown',
    status              VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
    total_uptime_hours  DECIMAL(10,2) DEFAULT 0,
    total_tokens_served BIGINT DEFAULT 0,
    total_earned        DECIMAL(12,4) DEFAULT 0,
    last_heartbeat      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── withdrawals 提现记录 ───
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id),
    amount              DECIMAL(12,4) NOT NULL,
    method              VARCHAR(20) NOT NULL CHECK (method IN ('alipay', 'bank', 'wechat')),
    account_info        TEXT NOT NULL,                   -- 收款账号（加密存储）
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    remark              TEXT,                            -- 审核备注
    created_at          TIMESTAMPTZ DEFAULT now(),
    processed_at        TIMESTAMPTZ
);

-- ─── 索引 ───
CREATE INDEX IF NOT EXISTS idx_supply_earnings_user_date ON public.supply_earnings(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_supply_nodes_user ON public.supply_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_accounts_user ON public.supply_accounts(user_id);

-- ─── RLS ───
ALTER TABLE public.supply_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supply owners can view own account"
    ON public.supply_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Supply owners can view own earnings"
    ON public.supply_earnings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Supply owners can view own nodes"
    ON public.supply_nodes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Supply owners can view own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = user_id);

-- ─── 种子数据 - 示例供给方收益（演示用） ───
-- 注意：这些数据需要在有对应 user 后才能插入，此处留空，由系统运行时生成
