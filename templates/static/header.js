import { num2str, readType } from './types.js';
import { padding, notNetcdf, readName } from './utils.js';
// Grammar constants
const ZERO = 0;
const NC_DIMENSION = 10;
const NC_VARIABLE = 11;
const NC_ATTRIBUTE = 12;
const NC_UNLIMITED = 0;
/**
 * Reads the file header as @see {@link Header}
 * @param buffer - Buffer for the file data
 * @param version - Version of the file
 * @returns
 */
export function header(buffer, version) {
    const header = { version };
    const recordDimension = {
        length: buffer.readUint32(),
    };
    const dimList = dimensionsList(buffer);
    if (!Array.isArray(dimList)) {
        recordDimension.id = dimList.recordId;
        recordDimension.name = dimList.recordName;
        header.dimensions = dimList.dimensions;
    }
    header.globalAttributes = attributesList(buffer);
    const variables = variablesList(buffer, recordDimension?.id, version);
    if (!Array.isArray(variables)) {
        header.variables = variables.variables;
        recordDimension.recordStep = variables.recordStep;
    }
    header.recordDimension = recordDimension;
    return header;
}
/**
 * List of dimensions
 * @param buffer - Buffer for the file data
 * @return List of dimensions
 */
function dimensionsList(buffer) {
    const result = {};
    let recordId, recordName;
    const dimList = buffer.readUint32();
    let dimensions;
    if (dimList === ZERO) {
        notNetcdf(buffer.readUint32() !== ZERO, 'wrong empty tag for list of dimensions');
        return [];
    }
    else {
        notNetcdf(dimList !== NC_DIMENSION, 'wrong tag for list of dimensions');
        // Length of dimensions
        const dimensionSize = buffer.readUint32();
        dimensions = new Array(dimensionSize);
        //populate `name` and `size` for each dimension
        for (let dim = 0; dim < dimensionSize; dim++) {
            // Read name
            const name = readName(buffer);
            // Read dimension size
            const size = buffer.readUint32();
            if (size === NC_UNLIMITED) {
                // in netcdf 3 one field can be of size unlimited
                recordId = dim;
                recordName = name;
            }
            dimensions[dim] = {
                name,
                size,
            };
        }
    }
    if (recordId !== undefined) {
        result.recordId = recordId;
    }
    if (recordName !== undefined) {
        result.recordName = recordName;
    }
    result.dimensions = dimensions;
    return result;
}
/**
 * List of attributes
 * @param buffer - Buffer for the file data
 * @return - List of attributes with:
 */
function attributesList(buffer) {
    const gAttList = buffer.readUint32();
    let attributes;
    if (gAttList === ZERO) {
        notNetcdf(buffer.readUint32() !== ZERO, 'wrong empty tag for list of attributes');
        return [];
    }
    else {
        notNetcdf(gAttList !== NC_ATTRIBUTE, 'wrong tag for list of attributes');
        // Length of attributes
        const attributeSize = buffer.readUint32();
        attributes = new Array(attributeSize);
        // Populate `name`, `type` and `value` for each attribute
        for (let gAtt = 0; gAtt < attributeSize; gAtt++) {
            // Read name
            const name = readName(buffer);
            // Read type
            const type = buffer.readUint32();
            notNetcdf(type < 1 || type > 6, `non valid type ${type}`);
            // Read attribute
            const size = buffer.readUint32();
            const value = readType(buffer, type, size);
            // Apply padding
            padding(buffer);
            attributes[gAtt] = {
                name,
                type: num2str(type),
                value,
            };
        }
    }
    return attributes;
}
/**
 * @param buffer - Buffer for the file data
 * @param recordId - Id of the unlimited dimension (also called record dimension)
 * This value may be undefined if there is no unlimited dimension
 * @param version - Version of the file
 * @return - Number of recordStep and list of variables @see {@link Variables}
 */
function variablesList(buffer, recordId, version) {
    const varList = buffer.readUint32();
    let recordStep = 0;
    let variables;
    if (varList === ZERO) {
        notNetcdf(buffer.readUint32() !== ZERO, 'wrong empty tag for list of variables');
        return [];
    }
    else {
        notNetcdf(varList !== NC_VARIABLE, 'wrong tag for list of variables');
        // Length of variables
        const variableSize = buffer.readUint32();
        variables = new Array(variableSize);
        for (let v = 0; v < variableSize; v++) {
            // Read name
            const name = readName(buffer);
            // Read dimensionality of the variable
            const dimensionality = buffer.readUint32();
            // Index into the list of dimensions
            const dimensionsIds = new Array(dimensionality);
            for (let dim = 0; dim < dimensionality; dim++) {
                dimensionsIds[dim] = buffer.readUint32();
            }
            // Read variables size
            const attributes = attributesList(buffer);
            // Read type
            const type = buffer.readUint32();
            notNetcdf(type < 1 && type > 6, `non valid type ${type}`);
            // Read variable size
            // The 32-bit varSize field is not large enough to contain the size of variables that require
            // more than 2^32 - 4 bytes, so 2^32 - 1 is used in the varSize field for such variables.
            const varSize = buffer.readUint32();
            // Read offset
            let offset = buffer.readUint32();
            if (version === 2) {
                notNetcdf(offset > 0, 'offsets larger than 4GB not supported');
                offset = buffer.readUint32();
            }
            let record = false;
            // Count amount of record variables
            if (typeof recordId !== 'undefined' && dimensionsIds[0] === recordId) {
                recordStep += varSize;
                record = true;
            }
            variables[v] = {
                name,
                dimensions: dimensionsIds,
                attributes,
                type: num2str(type),
                size: varSize,
                offset,
                record,
            };
        }
    }
    return {
        variables,
        recordStep,
    };
}
//# sourceMappingURL=header.js.map