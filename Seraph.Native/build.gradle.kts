plugins {
    kotlin("multiplatform") version "2.1.20"
    kotlin("plugin.serialization") version "2.1.20"
    id("com.android.library") version "8.11.0"
    id("app.cash.sqldelight") version "2.0.2"
    id("org.jlleitschuh.gradle.ktlint") version "12.3.0"
}

group = "com.seraph"
version = "unspecified"

kotlin {
    androidTarget {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }
    iosArm64()
    iosSimulatorArm64()
    iosX64()

    sourceSets {
        commonMain.dependencies {
            implementation("com.seraph:Seraph.Core:unspecified")
            implementation("co.touchlab:kermit:2.0.4")
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.7.1")
            implementation("app.cash.sqldelight:coroutines-extensions:2.0.2")
        }
        androidMain.dependencies {
            implementation("app.cash.sqldelight:android-driver:2.0.2")
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.7.1")
            // RN native module bridge types (ReactApplicationContext, ReactMethod, Promise, etc.)
            // Match the app's React Native version (from node_modules: 0.81.5)
            implementation("com.facebook.react:react-android:0.81.5")
            // NotificationCompat used by the foreground service.
            implementation("androidx.core:core:1.13.1")
            // ProcessLifecycleOwner — tracks UI foreground/background state.
            implementation("androidx.lifecycle:lifecycle-process:2.8.7")
            // FrameworkSQLiteOpenHelperFactory — needed to open DB at absolute path
            implementation("androidx.sqlite:sqlite-framework:2.4.0")
            // SQLCipher — AES-256 encryption for the SQLite DB
            implementation("net.zetetic:sqlcipher-android:4.5.7") { artifact { type = "aar" } }
            implementation("androidx.sqlite:sqlite:2.4.0")
            // EncryptedSharedPreferences — wraps the DB passphrase with a hardware-backed KeyStore key
            implementation("androidx.security:security-crypto:1.1.0-alpha06")
            // Nordic Android BLE Library — handles GATT sequencing, write serialisation,
            // CCCD setup, and reconnection reliably.
            implementation("no.nordicsemi.android:ble:2.9.0")
            implementation("no.nordicsemi.android:ble-ktx:2.9.0")
        }
        val iosMain by creating {
            dependsOn(commonMain.get())
        }
        val iosArm64Main by getting { dependsOn(iosMain) }
        val iosSimulatorArm64Main by getting { dependsOn(iosMain) }
        val iosX64Main by getting { dependsOn(iosMain) }
        iosMain.dependencies {
            implementation("app.cash.sqldelight:native-driver:2.0.2")
        }
    }
}

sqldelight {
    databases {
        create("SeraphDb") {
            packageName.set("com.seraph.native.db")
            srcDirs.setFrom("src/commonMain/sqldelight")
            deriveSchemaFromMigrations.set(true)
            verifyMigrations.set(true)
        }
    }
}

ktlint {
    version.set("1.5.0")
    android.set(true) // Enables Android-specific rules
    outputColorName.set("RED")
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
    }
    filter {
        exclude { entry -> entry.file.path.contains("/build/generated/") }
        exclude { entry -> entry.file.path.contains("/build/generated-sources/") }
    }
}

android {
    namespace = "com.seraph.wnative"
    compileSdk = 35
    defaultConfig {
        minSdk = 26
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets {
        getByName("debug").java.srcDirs("src/debug/kotlin")
        getByName("release").java.srcDirs("src/release/kotlin")
    }
}
