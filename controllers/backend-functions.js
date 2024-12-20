// controllers/backend-functions.js
const dbConn = require('../db-connection');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
dbConn.initializeDatabase(); // Call this in app.js for initialization
const db = dbConn.getDb(); // Safely get the connection

const dateTime = () => {
  const now = new Date();
const formatDate = now.toISOString().split('T')[0];
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const formatTime = `${hours}:${minutes}:${seconds}`;
return { date: formatDate, time: formatTime };

};

const deleted = (req, res) => {
  const { tableName, whereCondition } = req.body;

  if (!tableName || typeof tableName !== 'string' || Object.keys(whereCondition).length === 0) {
    return res.json({ success: false, message: 'Invalid input data.' });
  }

  const { date, time } = dateTime(); // Get current date and time

  try {
    if (whereCondition) {
      // Handle update logic if whereCondition is specified
      const sqlUpdate = `
        UPDATE ${mysql.escapeId(tableName)} 
        SET deleteon = ?, deleteat = ?
        WHERE ${whereCondition} and deleteon='0000-00-00' and deleteat='00:00:00'
      `;
      db.query(sqlUpdate, [date, time], (err, result) => {
        if (err) {
          console.error('Error updating data:', err);
          return res.json({ success: false, message: err.message });
        }

        if (result.affectedRows === 0) {
          return res.json({ success: false, message: 'No matching records found to update.' });
        }

        return res.json({ success: true, message: 'Data updated successfully.' });
      });
    }
  }
  catch (error) {
    console.error('Operation error:', error);
    return res.json({ success: false, message: error.message });
  }
};

const insert = async (req, res) => {
  const { tableName, data } = req.body;

  if (!tableName || typeof tableName !== 'string' || Object.keys(data).length === 0) {
    return { success: false, message: 'Invalid input data.' };
  }

  const { date, time } = dateTime(); // Get current date and time

  // Prepare the SQL query
  const sqlInsert = `INSERT INTO ${mysql.escapeId(tableName)} SET ?`;
  const completeData = {
    ...data,
    entrydate: date,
    entrytime: time,
  };

  return new Promise((resolve, reject) => {
    // Execute the SQL query
    db.query(sqlInsert, completeData, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        reject({ success: false, message: err.message });
      } else {
        // After insert, retrieve the last inserted ID
        const lastInsertId = result.insertId;
        resolve({
          success: true,
          message: 'Data inserted successfully.',
          lastInsertId: lastInsertId, // Returning the last inserted ID
        });
      }
    });
  });
};




const createTable = (req, res) => {
    const { table_Name } = req.body;
  
    // Validate the table name to prevent SQL injection and errors
    if (!table_Name || typeof table_Name !== 'string' || table_Name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid table name.' });
    }
  
    // Use `mysql.escapeId` to safely escape table names
    const escapedtable_Name = mysql.escapeId(table_Name);
  
    // SQL query to create the table with predefined columns
    const createTableQuery = `
      CREATE TABLE ${escapedtable_Name} (
        uniqueid INT AUTO_INCREMENT PRIMARY KEY,
        branch VARCHAR(50) not null,
        system_info VARCHAR(128) not null,
        deleteon DATE not null,
        deleteat TIME not null,
        deleteid VARCHAR(10) not null,
        deletename VARCHAR(50) not null,
        entrydate DATE not null not null,
        entrytime TIME not null not null,
        enteredbyid VARCHAR(10) not null,
        enteredbyname VARCHAR(50) not null
      );
    `;
    // Execute the query to create the table
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating table: ', err);
        // Return detailed error messages only in development mode for debugging purposes
        return res.status(500).json({ success: false, message: 'Failed to create table.', error: err.message });
      }
  
      res.status(200).json({ success: true, message: `Table '${table_Name}' created successfully.` });
    });
  };

  const fetchDataForTable = (request, response, table, columns, serialNeeded, act, customQueries = null, customActions = null, whereConditions = []) => {
    try {
      const { draw, start, length, order, search } = request.query;
  
      const column_index = (order && order[0]?.column) || 0;
      const column_sort_order = (order && order[0]?.dir) || 'desc';
      const column_name = (columns && columns[column_index]?.name) || 'uniqueid';
      const search_value = search?.value || '';
      const offset = parseInt(start) || 0;
      const limit = parseInt(length) || 10;
  
      // Dynamically construct WHERE clause safely using placeholders
      const searchQuery = search_value
        ? `WHERE ${columns.map(col => `${col.name} LIKE ?`).join(' OR ')}`
        : '';
  
      const fullWhereConditions = whereConditions.join(' AND ');
      const combinedWhereClause = fullWhereConditions
        ? `${searchQuery} ${searchQuery ? 'AND' : ''} ${fullWhereConditions}`
        : searchQuery;
  
      const queryParams = search_value
        ? [...columns.map(() => `%${search_value}%`), limit, offset]
        : [limit, offset];
  
      const columnList = columns.map(col => col.name).join(', ');
  
      let query1 = '';
      let query2 = '';
      let query3 = '';
      let query4 = '';
  
      if (customQueries) {
        query1 = customQueries.query1;
        query2 = customQueries.query2;
        query3 = customQueries.query3;
      } else {
        query1 = `
          SELECT 
            ${serialNeeded ? 'ROW_NUMBER() OVER (ORDER BY uniqueid desc) AS serial_number,' : ''}${columnList}, uniqueid
          FROM ${table} where
          ${combinedWhereClause}
          ORDER BY uniqueid ${column_sort_order}
        `;
  
        query2 = `SELECT COUNT(*) AS Total FROM ${table} where ${fullWhereConditions}`;
        query3 = `SELECT COUNT(*) AS Total FROM ${table} where ${combinedWhereClause}`;
        query4 = `SELECT * FROM ${table} WHERE uniqueid = ?`;
      }
  
      db.query(query1, queryParams, (dataError, dataResult) => {
        if (dataError) {
          console.error('Error fetching data:', dataError);
          return response.status(500).write('Error fetching data.');
        }
  
        const dataWithActionsPromises = dataResult.map(async (row) => {
          try {
            const detailedRecord = await new Promise((resolve, reject) => {
              db.query(query4, [row.uniqueid], (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result[0]);
                }
              });
            });
  
            const editFunction = customActions?.edit || 'editRow';
            const deleteFunction = customActions?.delete || 'deleteRow';
  
            row.actions = `
              <div class='flex-with-space'>
                <img src="/images/edit.png" width="25" height="25" class="edit-icon" title="" id="${editFunction}${row.uniqueid}" uniquekey="${row.uniqueid}" datas='${JSON.stringify(detailedRecord)}'>
                <img src="/images/delete.png" class="delete-icon" title="" width="25" height="25" id="${deleteFunction}${row.uniqueid}" uniquekey="${row.uniqueid}" datas='${JSON.stringify(detailedRecord)}'>
              </div>
            `;
          } catch (err) {
            console.error('Error fetching detailed record for uniqueid:', row.uniqueid, err);
          }
          return row;
        });
  
        Promise.all(dataWithActionsPromises).then((dataWithActions) => {
          db.query(query2, (totalDataError, totalDataResult) => {
            if (totalDataError) {
              console.error('Error fetching total records:', totalDataError);
              return response.status(500).write('Error fetching total record count.');
            }
  
            db.query(query3, queryParams.slice(0, 2), (totalFilterDataError, totalFilterDataResult) => {
              if (totalFilterDataError) {
                console.error('Error fetching filtered records:', totalFilterDataError);
                return response.status(500).write('Error fetching filtered record count.');
              }
  
              const columns_arr = [];
              if (serialNeeded) {
                columns_arr.push({ title: 'S.No', data: 'serial_number' });
              }
  
              columns_arr.push(...columns.map(col => ({ title: col.title, data: col.name })));
  
              if (act) {
                columns_arr.push({ title: 'Actions', data: 'actions' });
              }
  
              const responseData = {
                draw: parseInt(draw) || 0,
                recordsTotal: totalDataResult[0]?.Total || 0,
                recordsFiltered: totalFilterDataResult[0]?.Total || 0,
                data: dataWithActions || [],
                columns: columns_arr
              };
  
              response.write(JSON.stringify(responseData));
              response.end();
            });
          });
        }).catch(err => {
          console.error('Error processing data with actions:', err);
          response.status(500).write('Error processing data.');
          response.end();
        });
      });
    } catch (error) {
      console.error('Unexpected server error:', error);
      response.status(500).write('Unexpected server error occurred.');
      response.end();
    }
  };
  


  
  // image uploader

  // Upload endpoint to handle image upload
const upload = (req, res) => {
  // Folder where images will be saved
  const uploadDir = path.join(__dirname, 'uploads');

  // Ensure the uploads folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  const imageData = req.body.image;
  
  if (!imageData) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  // Generate a unique filename
  const filename = `image_${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, filename);

  // Convert base64 to binary and write to file
  const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to save image' });
    }

    res.json({ success: true, message: 'Image uploaded successfully', filename });
  });
}

// Create an array of all defined functions for dynamic exporting
const methods = { dateTime, insert, createTable, upload, fetchDataForTable, deleted };

// Dynamically export all methods in the `methods` object
module.exports = methods;
