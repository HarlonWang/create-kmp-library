package __PACKAGE__

import androidx.compose.ui.window.ComposeUIViewController
import platform.UIKit.UIViewController

class MainViewControllerFactory {
    fun create(): UIViewController {
        return ComposeUIViewController {
            LibraryRoot()
        }
    }
}
