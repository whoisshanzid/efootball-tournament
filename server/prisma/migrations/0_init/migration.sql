-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "homeId" INTEGER NOT NULL,
    "awayId" INTEGER NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "played" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayId_fkey" FOREIGN KEY ("awayId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

