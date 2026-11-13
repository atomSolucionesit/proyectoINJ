-- CreateTable
CREATE TABLE `asistencias` (
    `id` VARCHAR(191) NOT NULL,
    `curso_id` VARCHAR(191) NOT NULL,
    `materia` VARCHAR(80) NOT NULL,
    `fecha` DATE NOT NULL,
    `alumno_id` VARCHAR(191) NOT NULL,
    `estado` ENUM('presente', 'tarde', 'ausente') NOT NULL,
    `tomada_por_id` VARCHAR(191) NULL,
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asistencias_curso_id_materia_fecha_alumno_id_key`(`curso_id`, `materia`, `fecha`, `alumno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_tomada_por_id_fkey` FOREIGN KEY (`tomada_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
