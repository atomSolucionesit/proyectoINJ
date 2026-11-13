-- CreateTable
CREATE TABLE `noticias` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `titulo` VARCHAR(160) NOT NULL,
    `categoria` VARCHAR(40) NOT NULL,
    `resumen` VARCHAR(400) NOT NULL,
    `contenido` TEXT NOT NULL,
    `imagen` VARCHAR(255) NULL,
    `publicada` BOOLEAN NOT NULL DEFAULT false,
    `publicada_en` DATETIME(3) NULL,
    `autor_id` VARCHAR(191) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `noticias_slug_key`(`slug`),
    INDEX `noticias_publicada_publicada_en_idx`(`publicada`, `publicada_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventos` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(160) NOT NULL,
    `fecha` DATE NOT NULL,
    `horario` VARCHAR(40) NULL,
    `lugar` VARCHAR(160) NULL,
    `categoria` VARCHAR(40) NOT NULL,
    `descripcion` TEXT NULL,
    `creado_por_id` VARCHAR(191) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `eventos_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `noticias` ADD CONSTRAINT `noticias_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eventos` ADD CONSTRAINT `eventos_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
