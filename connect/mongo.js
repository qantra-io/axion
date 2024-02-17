const mongoose      = require('mongoose');
mongoose.Promise    = global.Promise;

const models = {};

module.exports = ({uri})=>{
  //database connection
  mongoose.connect(uri, {
    // useNewUrlParser: true,
    useUnifiedTopology: true,
  });


  // When successfully connected
  mongoose.connection.on('connected', function () {
    console.log('💾  Mongoose default connection open to ' + uri);
  });

  // If the connection throws an error
  mongoose.connection.on('error',function (err) {
    console.log('💾  Mongoose default connection error: ' + err);
    console.log('=> if using local mongodb: make sure that mongo server is running \n'+
      '=> if using online mongodb: check your internet connection \n');
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {
    console.log('💾  Mongoose default connection disconnected');
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    mongoose.connection.close(function () {
      console.log('💾  Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });

  const getModel = ({schemaDefinition, modelName, indecies}) => {
    if(!models[modelName]){
      const schema = new mongoose.Schema(schemaDefinition);
      for(index of indecies){
        schema.index(...index);
      }
      models[modelName] = mongoose.model(modelName, schema);
    }

    return models[modelName];
  };

  return {
    CRUD: ({schemaDefinition, modelName,indecies}) => {
      indecies = indecies || [];
      const Model = getModel({schemaDefinition, modelName,indecies});
      return {
        create: async (data) => {
          try {
            const newEntity = new Model(data);
            await newEntity.save();
            console.log(`${modelName} added to the database:`, newEntity);
            return newEntity;
          } catch (error) {
            console.error(`Error adding ${modelName} to the database:`, error);
            throw error;
          }
        },

        read: async (query = {}) => {
          try {
            const entities = await Model.find(query);
            console.log(`${modelName}(s) retrieved from the database:`, entities);
            return entities;
          } catch (error) {
            console.error(`Error retrieving ${modelName}(s) from the database:`, error);
            throw error;
          }
        },

        update: async (id, data) => {
          try {
            const updatedEntity = await Model.findByIdAndUpdate(id, data, { new: true });
            console.log(`${modelName} updated in the database:`, updatedEntity);
            return updatedEntity;
          } catch (error) {
            console.error(`Error updating ${modelName} in the database:`, error);
            throw error;
          }
        },

        delete: async (id) => {
          try {
            const deletedEntity = await Model.findByIdAndDelete(id);
            console.log(`${modelName} deleted from the database:`, deletedEntity);
            return deletedEntity;
          } catch (error) {
            console.error(`Error deleting ${modelName} from the database:`, error);
            throw error;
          }
        },
      };
    },
  };
}
