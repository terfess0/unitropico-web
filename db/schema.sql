-- Schema definitions for Unitrópico Web. (Database creation excluded for shared hosting compatibility)

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    revision INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS contents (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50),
    title VARCHAR(255),
    type ENUM('image', 'video', 'html', 'pdf'),
    src TEXT,
    html VARCHAR(500),
    allow_scripts BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS sequences (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50),
    title VARCHAR(255),
    order_index INT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS sequence_contents (
    sequence_id VARCHAR(100),
    content_id VARCHAR(100),
    order_index INT,
    PRIMARY KEY (sequence_id, content_id),
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hotspots (
    id VARCHAR(100) PRIMARY KEY,
    content_id VARCHAR(100),
    x FLOAT,
    y FLOAT,
    width FLOAT,
    height FLOAT,
    action VARCHAR(50),
    target VARCHAR(100),
    title VARCHAR(255),
    zindex INT DEFAULT 0,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);
