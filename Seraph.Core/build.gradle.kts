plugins {
    kotlin("multiplatform") version "2.1.20"
    id("org.jlleitschuh.gradle.ktlint") version "12.3.0"
}

group = "com.seraph"
version = "unspecified"

ktlint {
    version.set("1.5.0")
    android.set(false)
    outputColorName.set("RED")
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
    }
    filter {
        exclude("**/generated/**")
        exclude("**/build/**")
    }
}

kotlin {
    jvm()
    iosArm64()
    iosSimulatorArm64()
    iosX64()

    sourceSets {
        commonMain.dependencies {
            implementation("co.touchlab:kermit:2.0.4")
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}
