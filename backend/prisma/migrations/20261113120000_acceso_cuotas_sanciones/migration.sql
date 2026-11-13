-- Ingreso con nombre completo + contraseña (visible para el administrador), superadministrador,
-- cuotas, amonestaciones, positivos/negativos, asistencia del personal y pago de impresiones en efectivo.
-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `es_superadmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nombre_clave` VARCHAR(120) NULL,
    ADD COLUMN `password_cifrada` VARCHAR(255) NULL,
    ADD COLUMN `sexo` ENUM('F', 'M') NULL,
    ADD COLUMN `telefono` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `reservas_impresion` ADD COLUMN `metodo_pago` ENUM('efectivo', 'mercadopago') NULL;

-- CreateTable
CREATE TABLE `puntos` (
    `id` VARCHAR(191) NOT NULL,
    `curso_id` VARCHAR(191) NOT NULL,
    `materia` VARCHAR(80) NOT NULL,
    `alumno_id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('positivo', 'negativo') NOT NULL,
    `puesto_por_id` VARCHAR(191) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `puntos_curso_id_materia_idx`(`curso_id`, `materia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sanciones` (
    `alumno_id` VARCHAR(191) NOT NULL,
    `amonestaciones` INTEGER NOT NULL DEFAULT 0,
    `apercibimientos` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`alumno_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asistencia_personal` (
    `id` VARCHAR(191) NOT NULL,
    `persona_id` VARCHAR(191) NOT NULL,
    `fecha` DATE NOT NULL,
    `estado` ENUM('presente', 'tarde', 'ausente') NOT NULL,

    UNIQUE INDEX `asistencia_personal_persona_id_fecha_key`(`persona_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config_cuotas` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `monto` INTEGER NOT NULL,
    `dia_vencimiento` TINYINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_cuotas` (
    `id` VARCHAR(191) NOT NULL,
    `alumno_id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(7) NOT NULL,
    `monto` INTEGER NOT NULL,
    `metodo` ENUM('mercadopago', 'tarjeta') NOT NULL,
    `pagado_por_id` VARCHAR(191) NULL,
    `pagado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visto` BOOLEAN NOT NULL DEFAULT false,

    INDEX `pagos_cuotas_visto_idx`(`visto`),
    UNIQUE INDEX `pagos_cuotas_alumno_id_mes_key`(`alumno_id`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telefonos_cuotas` (
    `alumno_id` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`alumno_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recordatorios_cuotas` (
    `id` VARCHAR(191) NOT NULL,
    `alumno_id` VARCHAR(191) NOT NULL,
    `enviado_por_id` VARCHAR(191) NULL,
    `enviado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `meses` VARCHAR(200) NOT NULL,
    `monto` INTEGER NOT NULL,

    INDEX `recordatorios_cuotas_alumno_id_idx`(`alumno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `usuarios_nombre_clave_key` ON `usuarios`(`nombre_clave`);

-- AddForeignKey
ALTER TABLE `puntos` ADD CONSTRAINT `puntos_curso_id_fkey` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puntos` ADD CONSTRAINT `puntos_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `puntos` ADD CONSTRAINT `puntos_puesto_por_id_fkey` FOREIGN KEY (`puesto_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sanciones` ADD CONSTRAINT `sanciones_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistencia_personal` ADD CONSTRAINT `asistencia_personal_persona_id_fkey` FOREIGN KEY (`persona_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_cuotas` ADD CONSTRAINT `pagos_cuotas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_cuotas` ADD CONSTRAINT `pagos_cuotas_pagado_por_id_fkey` FOREIGN KEY (`pagado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_cuotas` ADD CONSTRAINT `telefonos_cuotas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios_cuotas` ADD CONSTRAINT `recordatorios_cuotas_alumno_id_fkey` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios_cuotas` ADD CONSTRAINT `recordatorios_cuotas_enviado_por_id_fkey` FOREIGN KEY (`enviado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

