-- CreateTable
CREATE TABLE "transactionsPlanning" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "date" DATE NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactionsPlanning_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transactionsPlanning" ADD CONSTRAINT "transactionsPlanning_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactionsPlanning" ADD CONSTRAINT "transactionsPlanning_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
