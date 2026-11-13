-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `curso`,
    ADD COLUMN `curso_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `cursos` (
    `id` VARCHAR(191) NOT NULL,
    `anio` TINYINT NOT NULL,
    `division` VARCHAR(10) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cursos_anio_division_key`(`anio`, `division`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `docentes_curso` (
    `id` VARCHAR(191) NOT NULL,
    `curso_id` VARCHAR(191) NOT NULL,
    `profesor_id` VARCHAR(191) NOT NULL,
    `materia` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `docentes_curso_curso_id_materia_key`(`curso_id`, `materia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `docentes_curso` ADD CONSTRAINT `docentes_curso_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `docentes_curso` ADD CONSTRAINT `docentes_curso_profesor_id_fkey` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
