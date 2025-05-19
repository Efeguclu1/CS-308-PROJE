# Veritabanı Kurulum ve Güncelleme Adımları

## İlk Kurulum
1. MySQL veritabanını oluşturun:
   ```sql
   CREATE DATABASE online_store;
   USE online_store;
   ```

2. Ana şema ve tabloları oluşturun:
   ```bash
   mysql -u your_username -p online_store < online_store_schema.sql
   ```

3. Örnek verileri ekleyin:
   ```bash
   mysql -u your_username -p online_store < sample_data.sql
   ```

## Güncellemeler
Aşağıdaki SQL dosyalarını sırasıyla çalıştırın:

1. Sipariş teslim tarihi için:
   ```bash
   mysql -u your_username -p online_store < alter_orders_table.sql
   ```

2. Bildirimler için:
   ```bash
   mysql -u your_username -p online_store < create_notifications_table.sql
   ```

3. İndirimler için:
   ```bash
   mysql -u your_username -p online_store < create_discounts_table.sql
   ```

4. Ürün maliyeti için:
   ```bash
   mysql -u your_username -p online_store < add_cost_column.sql
   ```

5. Bildirim ve indirim güncellemeleri için:
   ```bash
   mysql -u your_username -p online_store < update_notifications_and_discounts.sql
   ```

## Önemli Notlar
- Tüm SQL dosyaları projenin kök dizininde bulunmaktadır
- Veritabanı güncellemelerini sırasıyla yapmanız önemlidir
- Herhangi bir hata durumunda, MySQL hata mesajını kontrol edin
- Safe update mode hataları için `SET SQL_SAFE_UPDATES = 0;` komutunu kullanabilirsiniz 