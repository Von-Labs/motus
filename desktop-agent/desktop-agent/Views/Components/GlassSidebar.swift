import SwiftUI

struct GlassSidebar: View {
    @Binding var selection: AppSection?

    var body: some View {
        List(AppSection.allCases, selection: $selection) { section in
            Label(section.title, systemImage: section.systemImage)
                .tag(section)
                .padding(.vertical, 6)
        }
        .listStyle(.sidebar)
        .scrollContentBackground(.hidden)
        .background(
            LinearGradient(
                colors: [Color.white.opacity(0.25), Color.white.opacity(0.08)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .background(.ultraThinMaterial)
        )
        .navigationTitle("Defi Agent")
    }
}
