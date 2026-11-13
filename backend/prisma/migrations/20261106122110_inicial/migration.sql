-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `rol` ENUM('admin', 'profesor', 'alumno', 'padre', 'bibliotecaria') NOT NULL,
    `dni` VARCHAR(20) NULL,
    `curso` VARCHAR(40) NULL,
    `padre_id` VARCHAR(191) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archivos_biblioteca` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `categoria` VARCHAR(40) NOT NULL,
    `visibilidad` ENUM('biblioteca', 'impresion') NOT NULL,
    `nombre_original` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(120) NOT NULL,
    `tamano` INTEGER NOT NULL,
    `subido_por_id` VARCHAR(191) NOT NULL,
    `expira_en` DATETIME(3) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `archivos_biblioteca_visibilidad_expira_en_idx`(`visibilidad`, `expira_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas_impresion` (
    `id` VARCHAR(191) NOT NULL,
    `archivo_id` VARCHAR(191) NULL,
    `archivo_nombre` VARCHAR(200) NOT NULL,
    `paginas` INTEGER NOT NULL,
    `copias` INTEGER NOT NULL,
    `color` BOOLEAN NOT NULL,
    `doble_faz` BOOLEAN NOT NULL,
    `anillado` BOOLEAN NOT NULL,
    `notas` TEXT NULL,
    `total` INTEGER NOT NULL,
    `estado` ENUM('pendiente_pago', 'pagada', 'lista', 'retirada', 'cancelada') NOT NULL DEFAULT 'pendiente_pago',
    `codigo_retiro` VARCHAR(20) NOT NULL,
    `solicitante_id` VARCHAR(191) NOT NULL,
    `pago_id` VARCHAR(191) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pagado_en` DATETIME(3) NULL,

    UNIQUE INDEX `reservas_impresion_codigo_retiro_key`(`codigo_retiro`),
    INDEX `reservas_impresion_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_padre_id_fkey` FOREIGN KEY (`padre_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archivos_biblioteca` ADD CONSTRAINT `archivos_biblioteca_subido_por_id_fkey` FOREIGN KEY (`subido_por_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas_impresion` ADD CONSTRAINT `reservas_impresion_archivo_id_fkey` FOREIGN KEY (`archivo_id`) REFERENCES `archivos_biblioteca`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas_impresion` ADD CONSTRAINT `reservas_impresion_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
