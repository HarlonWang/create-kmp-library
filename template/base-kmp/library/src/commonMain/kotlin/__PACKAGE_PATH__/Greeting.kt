package __PACKAGE__

expect val platformName: String

class Greeting {
    fun greet(): String {
        return "Hello from $platformName!"
    }
}
