# Veritabanı Kurulum Adımları

## Yeni Konsolide Kurulum (Önerilen)
Artık tüm veritabanı kurulum ve güncelleme adımları tek bir SQL dosyasında birleştirilmiştir:

1. MySQL veritabanını oluşturun ve tüm tabloları tek adımda kurun:
   ```bash
   mysql -u your_username -p < database_setup.sql
   ```

Bu dosya aşağıdaki bileşenleri içerir:
- Veritabanı oluşturma
- Tüm temel tablolar (users, products, orders, vb.)
- Ek özellik tabloları (payment_info, refund_requests, discounts, vb.)
- Tax ID desteği
- Tetikleyiciler (triggers)
- Örnek veriler

## Eski Kurulum Yöntemi (Kullanımdan Kaldırılmıştır)
Aşağıdaki adımlar artık önerilmemektedir, bunun yerine yukarıdaki konsolide kurulum yöntemini kullanın:

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

4. Güncellemeleri uygulayın (alter_orders_table.sql, create_notifications_table.sql, vb.)

## Önemli Notlar
- Yeni kurulum dosyası (`database_setup.sql`) tüm gerekli tabloları, indeksleri ve örnek verileri içerir
- Tax ID özelliği için gerekli sütun ve indeks otomatik olarak oluşturulur
- Herhangi bir hata durumunda, MySQL hata mesajını kontrol edin
- Safe update mode hataları için `SET SQL_SAFE_UPDATES = 0;` komutunu kullanabilirsiniz 