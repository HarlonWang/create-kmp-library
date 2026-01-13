import com.android.build.api.dsl.androidLibrary
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.plugin.mpp.KotlinNativeTarget
import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.android.kotlin.multiplatform.library)
    alias(libs.plugins.vanniktech.mavenPublish)
}

group = "__GROUP_ID__"
version = "__VERSION__"

val frameworkName = "__FRAMEWORK_NAME__"
val xcframework = XCFramework(frameworkName)

kotlin {
    androidLibrary {
        namespace = "__PACKAGE__.library"
        compileSdk = libs.versions.android.compileSdk.get().toInt()
        minSdk = libs.versions.android.minSdk.get().toInt()

        withJava()

        compilations.configureEach {
            compileTaskProvider.configure {
                compilerOptions {
                    jvmTarget.set(JvmTarget.JVM_11)
                }
            }
        }
    }

    iosArm64()
    iosSimulatorArm64()

    __EXTRA_KOTLIN_TARGETS__

    targets.withType(KotlinNativeTarget::class.java).configureEach {
        binaries.framework {
            baseName = frameworkName
            binaryOption("bundleId", "__IOS_FRAMEWORK_BUNDLE_ID__")
            xcframework.add(this)
        }
    }

    sourceSets {
        commonMain.dependencies {
        }

        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
    }
}

mavenPublishing {
    coordinates(group.toString(), "__ARTIFACT_ID__", version.toString())

    pom {
        name.set("__ARTIFACT_ID__")
        description.set("A Kotlin Multiplatform library.")
    }
}
