// Test script to verify highlighting functionality
// Run this in the browser console when on the configurator page

console.log('🧪 Testing material highlighting...');

// Test 1: Check if setHighlightedSection exists
const store = window.useConfiguratorStore?.getState?.();
if (store?.setHighlightedSection) {
  console.log('✅ setHighlightedSection function exists');
  
  // Test 2: Try to highlight first section
  const sections = store.sections;
  if (sections.length > 0) {
    const firstSection = sections[0];
    console.log(`📍 Attempting to highlight section: ${firstSection.name}`);
    
    // Highlight the section
    store.setHighlightedSection(firstSection.id);
    
    // Check if highlighted state is set
    setTimeout(() => {
      const currentState = window.useConfiguratorStore.getState();
      if (currentState.highlightedSectionId === firstSection.id) {
        console.log('✅ Section highlighted successfully');
      } else {
        console.log('❌ Section highlighting failed');
      }
    }, 100);
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      store.setHighlightedSection(null);
      console.log('🧹 Highlight cleared');
    }, 2000);
  } else {
    console.log('⚠️ No sections found to test');
  }
} else {
  console.log('❌ Store or setHighlightedSection not found');
}
