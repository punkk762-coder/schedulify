import { prisma } from "../db";
import type { PlanStatus } from "@prisma/client";

/**
 * Plan service — CRUD + lifecycle.
 */
export const planService = {
  async create(data: { name: string; category?: string }) {
    return prisma.plan.create({
      data: {
        name: data.name,
        category: data.category,
        status: "DRAFT",
      },
    });
  },

  async getById(id: string) {
    return prisma.plan.findUnique({
      where: { id },
      include: {
        routineItems: {
          include: {
            schedules: true,
            meal: { include: { components: true } },
            primaryAlternatives: { include: { alternativeItem: true } },
            nutritionSnapshots: { where: { source: "PLANNED" } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  },

  async list() {
    return prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { routineItems: true } },
      },
    });
  },

  async getActive() {
    return prisma.plan.findMany({
      where: { status: "ACTIVE" },
      include: {
        routineItems: {
          include: {
            schedules: true,
            meal: { include: { components: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  },

  async updateStatus(id: string, status: PlanStatus) {
    return prisma.plan.update({
      where: { id },
      data: { status },
    });
  },

  async activate(id: string) {
    return prisma.$transaction(async (tx) => {
      // Supersede currently active plans in same category
      const plan = await tx.plan.findUniqueOrThrow({ where: { id } });
      if (plan.category) {
        await tx.plan.updateMany({
          where: { status: "ACTIVE", category: plan.category, id: { not: id } },
          data: { status: "SUPERSEDED" },
        });
      }
      return tx.plan.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    });
  },
};
