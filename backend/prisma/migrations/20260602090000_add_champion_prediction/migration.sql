-- CreateTable
CREATE TABLE "ChampionPrediction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChampionPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChampionPrediction_userId_key" ON "ChampionPrediction"("userId");

-- AddForeignKey
ALTER TABLE "ChampionPrediction" ADD CONSTRAINT "ChampionPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
