-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "minorUnit" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "openingBalanceMinor" BIGINT NOT NULL DEFAULT 0,
    "openingBalanceDate" DATETIME NOT NULL,
    "institutionName" TEXT,
    "description" TEXT,
    "creditLimitMinor" BIGINT,
    "statementClosingDay" INTEGER,
    "paymentDueDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialAccount_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "FinancialAccount_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "PaymentCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkedAccountId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "visualTheme" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentCard_userId_linkedAccountId_fkey" FOREIGN KEY ("userId", "linkedAccountId") REFERENCES "FinancialAccount" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubCategory_userId_categoryId_fkey" FOREIGN KEY ("userId", "categoryId") REFERENCES "Category" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "paymentCardId" TEXT,
    "categoryId" TEXT,
    "subCategoryId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "transactionDate" DATETIME NOT NULL,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT,
    CONSTRAINT "Transaction_userId_accountId_currencyCode_fkey" FOREIGN KEY ("userId", "accountId", "currencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transaction_userId_accountId_paymentCardId_fkey" FOREIGN KEY ("userId", "accountId", "paymentCardId") REFERENCES "PaymentCard" ("userId", "linkedAccountId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transaction_userId_categoryId_fkey" FOREIGN KEY ("userId", "categoryId") REFERENCES "Category" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transaction_userId_categoryId_subCategoryId_fkey" FOREIGN KEY ("userId", "categoryId", "subCategoryId") REFERENCES "SubCategory" ("userId", "categoryId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transaction_userId_projectId_currencyCode_fkey" FOREIGN KEY ("userId", "projectId", "currencyCode") REFERENCES "Project" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transaction_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "destinationAccountId" TEXT NOT NULL,
    "sourceAmountMinor" BIGINT NOT NULL,
    "sourceCurrencyCode" TEXT NOT NULL,
    "destinationAmountMinor" BIGINT NOT NULL,
    "destinationCurrencyCode" TEXT NOT NULL,
    "exchangeRate" TEXT NOT NULL,
    "feeTransactionId" TEXT,
    "description" TEXT,
    "transferDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transfer_userId_sourceAccountId_sourceCurrencyCode_fkey" FOREIGN KEY ("userId", "sourceAccountId", "sourceCurrencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transfer_userId_destinationAccountId_destinationCurrencyCode_fkey" FOREIGN KEY ("userId", "destinationAccountId", "destinationCurrencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Transfer_userId_feeTransactionId_fkey" FOREIGN KEY ("userId", "feeTransactionId") REFERENCES "Transaction" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "ScheduledTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "paymentCardId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "nextDueDate" TEXT,
    "endDate" TEXT,
    "timeZone" TEXT NOT NULL,
    "automaticCreation" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT,
    CONSTRAINT "ScheduledTransaction_userId_accountId_currencyCode_fkey" FOREIGN KEY ("userId", "accountId", "currencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledTransaction_userId_accountId_paymentCardId_fkey" FOREIGN KEY ("userId", "accountId", "paymentCardId") REFERENCES "PaymentCard" ("userId", "linkedAccountId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledTransaction_userId_categoryId_fkey" FOREIGN KEY ("userId", "categoryId") REFERENCES "Category" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledTransaction_userId_categoryId_subCategoryId_fkey" FOREIGN KEY ("userId", "categoryId", "subCategoryId") REFERENCES "SubCategory" ("userId", "categoryId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledTransaction_userId_projectId_currencyCode_fkey" FOREIGN KEY ("userId", "projectId", "currencyCode") REFERENCES "Project" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledTransaction_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "ScheduledOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scheduledTransactionId" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledOccurrence_userId_scheduledTransactionId_fkey" FOREIGN KEY ("userId", "scheduledTransactionId") REFERENCES "ScheduledTransaction" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "ScheduledOccurrence_userId_transactionId_fkey" FOREIGN KEY ("userId", "transactionId") REFERENCES "Transaction" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT,
    "currencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Budget_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Budget_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "BudgetPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetPeriod_userId_budgetId_fkey" FOREIGN KEY ("userId", "budgetId") REFERENCES "Budget" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "budgetPeriodId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetItem_userId_budgetPeriodId_fkey" FOREIGN KEY ("userId", "budgetPeriodId") REFERENCES "BudgetPeriod" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "BudgetItem_userId_categoryId_fkey" FOREIGN KEY ("userId", "categoryId") REFERENCES "Category" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT,
    "currencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budgetAmountMinor" BIGINT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Project_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Project_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialProfileId" TEXT,
    "currencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "targetAmountMinor" BIGINT NOT NULL,
    "targetDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "FinancialGoal_userId_financialProfileId_fkey" FOREIGN KEY ("userId", "financialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "FinancialGoal_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "financialGoalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "description" TEXT,
    "contributionDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalContribution_userId_financialGoalId_currencyCode_fkey" FOREIGN KEY ("userId", "financialGoalId", "currencyCode") REFERENCES "FinancialGoal" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "GoalContribution_userId_accountId_currencyCode_fkey" FOREIGN KEY ("userId", "accountId", "currencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkedAccountId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originalAmountMinor" BIGINT NOT NULL,
    "annualInterestRate" TEXT,
    "minimumPaymentMinor" BIGINT,
    "startDate" TEXT NOT NULL,
    "nextDueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Debt_userId_linkedAccountId_currencyCode_fkey" FOREIGN KEY ("userId", "linkedAccountId", "currencyCode") REFERENCES "FinancialAccount" ("userId", "id", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "principalAmountMinor" BIGINT NOT NULL,
    "interestAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "feesAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtPayment_userId_debtId_accountId_currencyCode_fkey" FOREIGN KEY ("userId", "debtId", "accountId", "currencyCode") REFERENCES "Debt" ("userId", "id", "linkedAccountId", "currencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "DebtPayment_userId_transferId_accountId_currencyCode_fkey" FOREIGN KEY ("userId", "transferId", "accountId", "currencyCode") REFERENCES "Transfer" ("userId", "id", "destinationAccountId", "destinationCurrencyCode") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultCurrencyCode" TEXT NOT NULL,
    "defaultFinancialProfileId" TEXT,
    "locale" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY_MM_DD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Setting_defaultCurrencyCode_fkey" FOREIGN KEY ("defaultCurrencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "Setting_userId_defaultFinancialProfileId_fkey" FOREIGN KEY ("userId", "defaultFinancialProfileId") REFERENCES "FinancialProfile" ("userId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialProfile_userId_id_key" ON "FinancialProfile"("userId", "id");

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_financialProfileId_isActive_idx" ON "FinancialAccount"("userId", "financialProfileId", "isActive");

-- CreateIndex
CREATE INDEX "FinancialAccount_currencyCode_idx" ON "FinancialAccount"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_userId_id_key" ON "FinancialAccount"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_userId_id_currencyCode_key" ON "FinancialAccount"("userId", "id", "currencyCode");

-- CreateIndex
CREATE INDEX "PaymentCard_userId_linkedAccountId_isActive_idx" ON "PaymentCard"("userId", "linkedAccountId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCard_userId_id_key" ON "PaymentCard"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCard_userId_linkedAccountId_id_key" ON "PaymentCard"("userId", "linkedAccountId", "id");

-- CreateIndex
CREATE INDEX "Category_userId_isActive_idx" ON "Category"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_id_key" ON "Category"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_type_name_key" ON "Category"("userId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_userId_categoryId_id_key" ON "SubCategory"("userId", "categoryId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_userId_categoryId_name_key" ON "SubCategory"("userId", "categoryId", "name");

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_id_idx" ON "Transaction"("userId", "transactionDate", "id");

-- CreateIndex
CREATE INDEX "Transaction_userId_accountId_status_transactionDate_idx" ON "Transaction"("userId", "accountId", "status", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_financialProfileId_transactionDate_idx" ON "Transaction"("userId", "financialProfileId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_paymentCardId_transactionDate_idx" ON "Transaction"("userId", "paymentCardId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_transactionDate_idx" ON "Transaction"("userId", "categoryId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_projectId_transactionDate_idx" ON "Transaction"("userId", "projectId", "transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_id_key" ON "Transaction"("userId", "id");

-- CreateIndex
CREATE INDEX "Transfer_userId_transferDate_id_idx" ON "Transfer"("userId", "transferDate", "id");

-- CreateIndex
CREATE INDEX "Transfer_userId_sourceAccountId_status_transferDate_idx" ON "Transfer"("userId", "sourceAccountId", "status", "transferDate");

-- CreateIndex
CREATE INDEX "Transfer_userId_destinationAccountId_status_transferDate_idx" ON "Transfer"("userId", "destinationAccountId", "status", "transferDate");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_userId_id_key" ON "Transfer"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_userId_feeTransactionId_key" ON "Transfer"("userId", "feeTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_userId_id_destinationAccountId_destinationCurrencyCode_key" ON "Transfer"("userId", "id", "destinationAccountId", "destinationCurrencyCode");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_userId_isActive_nextDueDate_idx" ON "ScheduledTransaction"("userId", "isActive", "nextDueDate");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_userId_accountId_idx" ON "ScheduledTransaction"("userId", "accountId");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_userId_paymentCardId_idx" ON "ScheduledTransaction"("userId", "paymentCardId");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_userId_categoryId_idx" ON "ScheduledTransaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "ScheduledTransaction_userId_projectId_idx" ON "ScheduledTransaction"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTransaction_userId_id_key" ON "ScheduledTransaction"("userId", "id");

-- CreateIndex
CREATE INDEX "ScheduledOccurrence_userId_status_dueDate_idx" ON "ScheduledOccurrence"("userId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledOccurrence_userId_id_key" ON "ScheduledOccurrence"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledOccurrence_userId_scheduledTransactionId_dueDate_key" ON "ScheduledOccurrence"("userId", "scheduledTransactionId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledOccurrence_userId_transactionId_key" ON "ScheduledOccurrence"("userId", "transactionId");

-- CreateIndex
CREATE INDEX "Budget_userId_financialProfileId_isActive_idx" ON "Budget"("userId", "financialProfileId", "isActive");

-- CreateIndex
CREATE INDEX "Budget_currencyCode_idx" ON "Budget"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_id_key" ON "Budget"("userId", "id");

-- CreateIndex
CREATE INDEX "BudgetPeriod_userId_budgetId_endDate_idx" ON "BudgetPeriod"("userId", "budgetId", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPeriod_userId_id_key" ON "BudgetPeriod"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPeriod_userId_budgetId_startDate_key" ON "BudgetPeriod"("userId", "budgetId", "startDate");

-- CreateIndex
CREATE INDEX "BudgetItem_userId_categoryId_idx" ON "BudgetItem"("userId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_userId_id_key" ON "BudgetItem"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_userId_budgetPeriodId_categoryId_key" ON "BudgetItem"("userId", "budgetPeriodId", "categoryId");

-- CreateIndex
CREATE INDEX "Project_userId_financialProfileId_status_idx" ON "Project"("userId", "financialProfileId", "status");

-- CreateIndex
CREATE INDEX "Project_currencyCode_idx" ON "Project"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_id_key" ON "Project"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_id_currencyCode_key" ON "Project"("userId", "id", "currencyCode");

-- CreateIndex
CREATE INDEX "FinancialGoal_userId_financialProfileId_status_idx" ON "FinancialGoal"("userId", "financialProfileId", "status");

-- CreateIndex
CREATE INDEX "FinancialGoal_currencyCode_idx" ON "FinancialGoal"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialGoal_userId_id_key" ON "FinancialGoal"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialGoal_userId_id_currencyCode_key" ON "FinancialGoal"("userId", "id", "currencyCode");

-- CreateIndex
CREATE INDEX "GoalContribution_userId_financialGoalId_contributionDate_idx" ON "GoalContribution"("userId", "financialGoalId", "contributionDate");

-- CreateIndex
CREATE INDEX "GoalContribution_userId_accountId_financialGoalId_idx" ON "GoalContribution"("userId", "accountId", "financialGoalId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalContribution_userId_id_key" ON "GoalContribution"("userId", "id");

-- CreateIndex
CREATE INDEX "Debt_userId_status_nextDueDate_idx" ON "Debt"("userId", "status", "nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_userId_id_key" ON "Debt"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_userId_linkedAccountId_currencyCode_key" ON "Debt"("userId", "linkedAccountId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_userId_id_linkedAccountId_currencyCode_key" ON "Debt"("userId", "id", "linkedAccountId", "currencyCode");

-- CreateIndex
CREATE INDEX "DebtPayment_userId_debtId_idx" ON "DebtPayment"("userId", "debtId");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_userId_id_key" ON "DebtPayment"("userId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_userId_transferId_accountId_currencyCode_key" ON "DebtPayment"("userId", "transferId", "accountId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_key" ON "Setting"("userId");

-- CreateIndex
CREATE INDEX "Setting_defaultCurrencyCode_idx" ON "Setting"("defaultCurrencyCode");

-- CreateIndex
CREATE INDEX "Setting_userId_defaultFinancialProfileId_idx" ON "Setting"("userId", "defaultFinancialProfileId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_id_idx" ON "AuditLog"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_userId_entityType_entityId_createdAt_idx" ON "AuditLog"("userId", "entityType", "entityId", "createdAt");
