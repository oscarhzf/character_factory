import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const characterStatusEnum = pgEnum("character_status", [
  "draft",
  "active",
  "locked"
]);

export const jobModeEnum = pgEnum("job_mode", ["explore", "refine", "edit"]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "reviewing",
  "completed",
  "failed"
]);

export const anchorRoleEnum = pgEnum("anchor_role", [
  "master",
  "style_anchor",
  "pose_anchor",
  "deprecated_master"
]);

export const imageStatusEnum = pgEnum("image_status", [
  "created",
  "reviewed",
  "selected",
  "rejected",
  "candidate_master",
  "master"
]);

export const reviewerTypeEnum = pgEnum("reviewer_type", ["auto", "human"]);

export const decisionActionEnum = pgEnum("decision_action", [
  "keep",
  "reject",
  "candidate_master",
  "set_master",
  "refine_from_this"
]);

export const universes = pgTable("universes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  styleConstitutionJson: jsonb("style_constitution_json")
    .notNull()
    .default({}),
  globalPromptTemplate: text("global_prompt_template").notNull(),
  globalNegativeTemplate: text("global_negative_template"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  universeId: uuid("universe_id")
    .notNull()
    .references(() => universes.id, { onDelete: "restrict" }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  status: characterStatusEnum("status").notNull().default("draft"),
  description: text("description"),
  fixedTraitsJson: jsonb("fixed_traits_json").notNull().default({}),
  semiFixedTraitsJson: jsonb("semi_fixed_traits_json").notNull().default({}),
  variableDefaultsJson: jsonb("variable_defaults_json")
    .notNull()
    .default({}),
  paletteJson: jsonb("palette_json").notNull().default({}),
  negativeRulesJson: jsonb("negative_rules_json").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    mode: jobModeEnum("mode").notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
    sourceImageId: uuid("source_image_id"),
    inputConfigJson: jsonb("input_config_json").notNull().default({}),
    batchSize: integer("batch_size").notNull().default(1),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    characterCreatedIndex: index("idx_generation_jobs_character_created").on(
      table.characterId,
      table.createdAt
    )
  })
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => generationJobs.id, {
      onDelete: "set null"
    }),
    parentPromptVersionId: uuid("parent_prompt_version_id").references(
      (): AnyPgColumn => promptVersions.id,
      {
        onDelete: "set null"
      }
    ),
    scope: text("scope").notNull().default("job"),
    variantKey: text("variant_key"),
    strategy: text("strategy"),
    compiledPrompt: text("compiled_prompt").notNull(),
    compiledNegativePrompt: text("compiled_negative_prompt"),
    patchJson: jsonb("patch_json"),
    debugPayloadJson: jsonb("debug_payload_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    jobVariantIndex: index("idx_prompt_versions_job_variant").on(
      table.jobId,
      table.variantKey
    )
  })
);

export const generatedImages = pgTable(
  "generated_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => generationJobs.id, { onDelete: "cascade" }),
    promptVersionId: uuid("prompt_version_id").references(
      () => promptVersions.id,
      {
        onDelete: "set null"
      }
    ),
    sourceApi: text("source_api").notNull(),
    modelName: text("model_name").notNull(),
    imageUrl: text("image_url").notNull(),
    thumbUrl: text("thumb_url"),
    revisedPrompt: text("revised_prompt"),
    generationMetaJson: jsonb("generation_meta_json").notNull().default({}),
    status: imageStatusEnum("status").notNull().default("created"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    jobIndex: index("idx_generated_images_job").on(table.jobId)
  })
);

export const reviewResults = pgTable(
  "review_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    imageId: uuid("image_id")
      .notNull()
      .references(() => generatedImages.id, { onDelete: "cascade" }),
    reviewerType: reviewerTypeEnum("reviewer_type").notNull(),
    totalScore: numeric("total_score", { precision: 5, scale: 2 }).notNull(),
    styleScore: numeric("style_score", { precision: 5, scale: 2 }).notNull(),
    identityScore: numeric("identity_score", { precision: 5, scale: 2 }).notNull(),
    ratioScore: numeric("ratio_score", { precision: 5, scale: 2 }).notNull(),
    poseScore: numeric("pose_score", { precision: 5, scale: 2 }).notNull(),
    paletteScore: numeric("palette_score", { precision: 5, scale: 2 }).notNull(),
    sheetScore: numeric("sheet_score", { precision: 5, scale: 2 }).notNull(),
    masterPotentialScore: numeric("master_potential_score", {
      precision: 5,
      scale: 2
    })
      .notNull()
      .default("0"),
    tagsJson: jsonb("tags_json").notNull().default([]),
    notesJson: jsonb("notes_json").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    imageReviewerIndex: index("idx_review_results_image_reviewer").on(
      table.imageId,
      table.reviewerType
    )
  })
);

export const characterAnchorImages = pgTable(
  "character_anchor_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => generatedImages.id, { onDelete: "cascade" }),
    role: anchorRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    promptVersionId: uuid("prompt_version_id").references(
      () => promptVersions.id,
      {
        onDelete: "set null"
      }
    ),
    scoreSnapshotJson: jsonb("score_snapshot_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    characterActiveIndex: index("idx_anchor_images_character_active").on(
      table.characterId,
      table.isActive
    )
  })
);

export const humanDecisions = pgTable(
  "human_decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => generationJobs.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => generatedImages.id, { onDelete: "cascade" }),
    action: decisionActionEnum("action").notNull(),
    reasonsJson: jsonb("reasons_json").notNull().default({}),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    jobIndex: index("idx_human_decisions_job").on(table.jobId)
  })
);

export const generationJobsSourceImageForeignKey = {
  sourceImageId: generatedImages.id
};
