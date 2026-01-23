package __PACKAGE__

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import __GROUP_ID__.library.generated.resources.Res
import __GROUP_ID__.library.generated.resources.library_title
import org.jetbrains.compose.resources.stringResource

@Composable
fun LibraryRoot() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        Text("${Greeting().greet()} - ${stringResource(Res.string.library_title)}")
    }
}
