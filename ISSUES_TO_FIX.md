# Issues Found and Fixes Needed

## Issue 1: Profile Pictures & Banners Not Showing

**Problem**: 
- Upload functions save as `profile_pic_url` and `banner_image_url`
- Profile route looks for `profile_pic` and `banner_image`
- Field name mismatch causes images not to display

**Fix**: Update profile route to check both old and new field names

## Issue 2: View Details Button Reloads Page

**Problem**:
- `viewProductDetails()` function checks if user is logged in
- If not logged in, shows auth modal (correct)
- But the function is called from onclick in HTML, which might have issues

**Current code** (line 1063 in homepage.js):
```javascript
function viewProductDetails(productId) {
    isLoggedIn = checkIfLoggedIn();
    if (!isLoggedIn) {
        showAuthPromptModal();
        return;
    }
    window.location.href = `/product_details/${productId}`;
}
```

**Fix**: The function looks correct. Issue might be in how it's called from HTML.

## Issue 3: Add to Cart - Variants Not Loading

**Problem**:
- When opening add to cart modal, variants API is called
- If variants don't exist or API fails, falls back to legacy mode
- Stock information might not be properly retrieved

**Current behavior**:
1. Calls `/api/product_variants/${productId}`
2. If successful, populates color/size dropdowns
3. If fails, uses product's color/size attributes

**Potential issues**:
- API endpoint might not exist or return errors
- Firestore product documents might not have variants subcollection
- Stock field might be named differently in Firestore

## Issue 4: Cloudinary Images for Profile/Banner

**Problem**:
- Cloudinary environment variables not set in Railway
- Upload functions try Cloudinary first, then fall back to local storage
- Without env vars, all uploads go to local storage
- Local storage doesn't work on Railway (ephemeral filesystem)

**Fix**: Add Cloudinary environment variables to Railway
