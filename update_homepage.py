import re

# Read the file
with open('templates/homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Add category badge after product-image div opening tag
old1 = '<div class="product-image">\n                  <img'
new1 = '''<div class="product-image">
                  {% if product.category %}
                  <span class="product-category-badge">{{ product.category }}</span>
                  {% endif %}
                  <img'''
content = content.replace(old1, new1)

# Pattern 2: Wrap product-stock in product-meta and add seller info
old2 = '''                  <p class="product-stock">
                    <i class="fas fa-box"></i> Stock: {{ product.quantity or 0 }}
                  </p>
                </div>'''
new2 = '''                  <div class="product-meta">
                    <p class="product-stock">
                      <i class="fas fa-box"></i> Stock: {{ product.quantity or 0 }}
                    </p>
                    {% if product.seller_first_name %}
                    <p class="product-seller">
                      <i class="fas fa-store"></i> {{ product.seller_first_name }} {{ product.seller_last_name }}
                    </p>
                    {% endif %}
                  </div>
                </div>'''
content = content.replace(old2, new2)

# Write back
with open('templates/homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated homepage.html successfully!')
print('- Added category badges to product cards')
print('- Added seller info to product cards')
