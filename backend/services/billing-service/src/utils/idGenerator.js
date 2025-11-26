function generateBillingId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `BIL-${timestamp}-${random}`;
}

// Alternative: Sequential ID
function generateSequentialBillingId(count) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const sequence = String(count + 1).padStart(4, '0');
  return `BIL-${date}-${sequence}`;
}

module.exports = {
  generateBillingId,
  generateSequentialBillingId
};