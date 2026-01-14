import SwiftUI
import __FRAMEWORK_NAME__

struct ContentView: View {
    var body: some View {
        Text(Greeting().greet())
            .multilineTextAlignment(.center)
            .padding()
    }
}
