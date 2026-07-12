---
key: l7-mysql
level: L7
title: MySQL：安装、权限模型与备份恢复基础
lang: shell
objective: 完成 MySQL 安装初始化，理解 user@host 权限模型，掌握 mysqldump 备份与恢复
prereq: []
estimated_min: 45
sandbox: false
---

# MySQL：安装、权限模型与备份恢复基础

## 讲解

MySQL 是最常用的关系型数据库之一。L7 里它通常作为 L7-nginx 反向代理后端的存储层存在。本课聚焦三个运维必备点：**装好、管住权限、能备份能恢复**——后两点直接决定你夜里能不能睡安稳觉。

权限模型是 MySQL 新手最容易迷糊的地方：
- 账户是 **`'user'@'host'`** 二元组，`'app'@'localhost'` 和 `'app'@'192.168.1.%'` 是两个**不同**账户。host 限制「这个用户从哪台机器连」，写 `%` 表示任意（生产上应尽量收紧）。
- 授权用 `GRANT`：`GRANT SELECT, INSERT ON db.* TO 'app'@'%';`，再用 `FLUSH PRIVILEGES;` 生效（有些版本自动生效，但手动 flush 更稳妥）。
- 权限粒度：`*.*`（全局）> `db.*`（库）> `db.table`（表）。

备份与恢复是底线能力：
- **逻辑备份** `mysqldump`：导出成 SQL 文本，跨版本兼容好，适合中小库。大库会慢、锁表需注意。
- **恢复**就是把 SQL 文本 `source` 回去或管道喂给 `mysql`。
- 生产还应了解物理备份（如 Percona XtraBackup），本课先打牢逻辑备份基础。

## 动手实验

1. **安装与初始化**（Debian/Ubuntu，MySQL 8）：
   ```bash
   sudo apt update
   sudo apt install -y mysql-server
   sudo systemctl enable --now mysql
   sudo mysql -e "SELECT VERSION();"   # 预期看到 8.x 版本号
   ```

2. **安全初始化**（交互式，建议生产必做）：
   ```bash
   sudo mysql_secure_installation
   # 按提示设置 root 密码、移除匿名用户、禁止 root 远程登录、删 test 库
   ```

3. **建立应用专用账户并授权**：
   ```sql
   CREATE DATABASE appdb CHARACTER SET utf8mb4;
   CREATE USER 'app'@'192.168.1.%' IDENTIFIED BY 'StrongPass!23';
   GRANT SELECT, INSERT, UPDATE, DELETE ON appdb.* TO 'app'@'192.168.1.%';
   FLUSH PRIVILEGES;
   ```

4. **验证账户只能从指定网段连**：
   ```bash
   mysql -u app -p -h 192.168.1.10 appdb -e "SHOW TABLES;"
   ```

5. **备份（mysqldump）**：
   ```bash
   mysqldump -u root -p --single-transaction --routines --triggers appdb > appdb_$(date +%F).sql
   ls -lh appdb_*.sql
   ```

6. **恢复**：
   ```bash
   mysql -u root -p -e "CREATE DATABASE appdb_restore CHARACTER SET utf8mb4;"
   mysql -u root -p appdb_restore < appdb_2026-07-12.sql
   ```

## 常见错误

1. **`Access denied for user 'app'@'localhost'`**：你以为建了 `'app'@'%'`，但本地连默认走 `'app'@'localhost'`，二者不是一回事。连接来源（socket 本地 vs TCP 远程）决定匹配哪个 host，按需补建对应 host 的账户。
2. **root 用 `mysql -u root` 登不进**：MySQL 8 默认用 `auth_socket` 插件，只允许系统 root 通过 socket 登录。要么 `sudo mysql`，要么 `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '密码';`。
3. **备份时锁表/数据不一致**：MyISAM 会锁表；InnoDB 务必加 `--single-transaction` 拿到一致性快照，业务无感知。
4. **恢复报 `Unknown database`**：`mysqldump` 默认不建库，需先手动 `CREATE DATABASE` 再 `source`，或备份时加 `--databases` 让 dump 自带 `CREATE DATABASE`。

## 小结

- MySQL 账户是 `'user'@'host'` 二元组，host 控制来源，授权用 `GRANT` + `FLUSH PRIVILEGES`。
- 备份用 `mysqldump --single-transaction`（InnoDB 一致性），恢复先建库再导入。
- 进阶指引：L8 用 Ansible 把这整条「装 MySQL + 建库 + 授权」流水线一键化，并引入 ansible-vault 保管密码。
