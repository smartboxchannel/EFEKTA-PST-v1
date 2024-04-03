const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const e = exposes.presets;
const ea = exposes.access;

const tzLocal = {
    node_config: {
        key: ['reading_interval', 'config_report_enable', 'comparison_previous_data', 'pool_rate_on', 'battery_quantity', 'battery_size'],
        convertSet: async (entity, key, rawValue, meta) => {
			const endpoint = meta.device.getEndpoint(1);
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                reading_interval: ['genPowerCfg', {0x0201: {value, type: 0x21}}],
				config_report_enable: ['genPowerCfg', {0x0275: {value, type: 0x10}}],
				comparison_previous_data: ['genPowerCfg', {0x0205: {value, type: 0x10}}],
				pool_rate_on: ['genPowerCfg', {0x0216: {value, type: 0x10}}],
            };
            await endpoint.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
		convertGet: async (entity, key, meta) => {
			const endpoint = meta.device.getEndpoint(1);
            const payloads = {
                battery_quantity: ['genPowerCfg', 0x0033],
				battery_size: ['genPowerCfg', 0x0031],
            };
            await endpoint.read(payloads[key][0], [payloads[key][1]]);
        },
    },
	node_config2: {
         key: ['raw_temperature', 'temperature_offset'],
		 convertSet: async (entity, key, rawValue, meta) => {
			const endpoint = meta.device.getEndpoint(2);
            const value = parseFloat(rawValue)*10;
            const payloads = {
                temperature_offset: ['msTemperatureMeasurement', {0x0210: {value, type: 0x29}}],
            };
            await endpoint.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
		 convertGet: async (entity, key, meta) => {
			const endpoint = meta.device.getEndpoint(2);
            const payloads = {
                raw_temperature: ['msTemperatureMeasurement', 0x0007],
            };
            await endpoint.read(payloads[key][0], [payloads[key][1]]);
        },
    },
	node_config3: {
        key: ['sensor_identifier'],
        convertGet: async (entity, key, meta) => {
			const endpoint = meta.device.getEndpoint(1);
            const payloads = {
                sensor_identifier: ['genBasic', 0xA19B],
            };
            await endpoint.read(payloads[key][0], [payloads[key][1]]);
        },
    },
	node_config4: {
         key: ['pressure_offset'],
		 convertSet: async (entity, key, rawValue, meta) => {
			const endpoint = meta.device.getEndpoint(1);
            const value = parseFloat(rawValue)*10;
            const payloads = {
                pressure_offset: ['msPressureMeasurement', {0x0210: {value, type: 0x29}}],
            };
            await endpoint.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
};

const fzLocal = {
    node_config: {
        cluster: 'genPowerCfg',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0201)) {
                result.reading_interval = msg.data[0x0201];
            }
			if (msg.data.hasOwnProperty(0x0275)) {
				result.config_report_enable = ['OFF', 'ON'][msg.data[0x0275]];
            }
			if (msg.data.hasOwnProperty(0x0205)) {
				result.comparison_previous_data = ['OFF', 'ON'][msg.data[0x0205]];
            }
			if (msg.data.hasOwnProperty(0x0216)) {
                result.pool_rate_on = ['OFF', 'ON'][msg.data[0x0216]];
            }
			if (msg.data.hasOwnProperty(0x0033)) {
                result.battery_quantity = msg.data[0x0033];
            }
			if (msg.data.hasOwnProperty(0x0031)) {
                result.battery_size = msg.data[0x0031];
            }
            return result;
        },
    },
	node_config2: {
        cluster: 'msTemperatureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0007)) {
                result.raw_temperature = msg.data[0x0007];
            }
			if (msg.data.hasOwnProperty(0x0210)) {
                result.temperature_offset = parseFloat(msg.data[0x0210])/10.0;
            }
            return result;
        },
    },
	node_config3: {
        cluster: 'msPressureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
			bar = parseFloat(msg.data['measuredValue']) * 0.01;
			return {bar : bar};
        },
    },
	node_config4: {
        cluster: 'msPressureMeasurement',
        type: ['attributeReport', 'readResponse'],
		convert: (model, msg, publish, options, meta) => {
			psi = parseFloat(msg.data['measuredValue']) * 0.01 * 14.503773773;
			return {psi : psi};
        },
    },
	node_config5: {
        cluster: 'msPressureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
			if (msg.data.hasOwnProperty(0x0210)) {
                result.pressure_offset = parseFloat(msg.data[0x0210])/10.0;
            }
            return result;
        },
    },
	node_config6: {
        cluster: 'genBasic',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
			if (msg.data.hasOwnProperty(0xA19B)) {
                result.sensor_identifier = msg.data[0xA19B];
            }
            return result;
        },
    },
	uptime: {
        cluster: 'genTime',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            //return {uptime: Math.round(msg.data.localTime/60)};
			if (msg.data.hasOwnProperty('localTime')) {
				return {uptime: Math.round(msg.data.localTime/60/60)};
			}
        },
    },
};



const definition = {
        zigbeeModel: ['EFEKTA_PT_v1'],
        model: 'EFEKTA_PT_v1',
        vendor: 'EfektaLab',
        description: 'EFEKTA PT v1 - Water/gas pressure smart sensor.',
        fromZigbee: [fz.pressure, fz.battery, fzLocal.node_config, fzLocal.node_config2, fzLocal.node_config3, fzLocal.node_config4, fzLocal.node_config5, fzLocal.node_config6, fz.temperature, fzLocal.uptime],
        toZigbee: [tz.factory_reset, tzLocal.node_config, tzLocal.node_config2, tzLocal.node_config3, tzLocal.node_config4],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpointOne = device.getEndpoint(1);
			const endpointTwo = device.getEndpoint(2);
            await reporting.bind(endpointOne, coordinatorEndpoint, ['genPowerCfg', 'msPressureMeasurement']);
			await reporting.bind(endpointTwo, coordinatorEndpoint, ['msTemperatureMeasurement']);
			const overrides1 = {min: 0, max: 21600, change: 1};
			const overrides2 = {min: 30, max: 1800, change: 1};
			const overrides3 = {min: 30, max: 1800, change: 25};
            await reporting.batteryVoltage(endpointOne, overrides1);
            await reporting.batteryPercentageRemaining(endpointOne, overrides1);
			await reporting.batteryAlarmState(endpointOne, overrides1);
            await reporting.pressure(endpointOne, overrides2);
			await reporting.temperature(endpointTwo, overrides3);
        },
        icon: 'data:image/jpeg;base64,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OEJJTQQNAAAAAAAEAAAAWjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAAThCSU0EAgAAAAAABAAAAAA4QklNBDAAAAAAAAIBAThCSU0ELQAAAAAABgABAAAAAjhCSU0ECAAAAAAAEAAAAAEAAAJAAAACQAAAAAA4QklNBB4AAAAAAAQAAAAAOEJJTQQaAAAAAANLAAAABgAAAAAAAAAAAAAAfQAAAH0AAAALBBEENQQ3ACAEOAQ8BDUEPQQ4AC0AMQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAfQAAAH0AAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAQAAAAAAAG51bGwAAAACAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAAAH0AAAAAUmdodGxvbmcAAAB9AAAABnNsaWNlc1ZsTHMAAAABT2JqYwAAAAEAAAAAAAVzbGljZQAAABIAAAAHc2xpY2VJRGxvbmcAAAAAAAAAB2dyb3VwSURsb25nAAAAAAAAAAZvcmlnaW5lbnVtAAAADEVTbGljZU9yaWdpbgAAAA1hdXRvR2VuZXJhdGVkAAAAAFR5cGVlbnVtAAAACkVTbGljZVR5cGUAAAAASW1nIAAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAAB9AAAAAFJnaHRsb25nAAAAfQAAAAN1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cDpNb2RpZnlEYXRlPSIyMDI0LTAxLTA5VDA0OjAyOjA5KzAzOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc4Zjk5OWE4LTM3MDAtOGM0ZS1iNTI4LWJkZDFiOTY1Mjg4MSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmQ5MTRmNGZjLWZkZjQtNmU0Yi1hY2FiLWIzYjNkNDc3OTkyNCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmMxZTQ4YjkwLWM4M2ItNmQ0NC04N2EyLWI2OGMzNTA4M2NkZSIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjMWU0OGI5MC1jODNiLTZkNDQtODdhMi1iNjhjMzUwODNjZGUiIHN0RXZ0OndoZW49IjIwMjQtMDEtMDlUMDQ6MDI6MDkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NzhmOTk5YTgtMzcwMC04YzRlLWI1MjgtYmRkMWI5NjUyODgxIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTA5VDA0OjAyOjA5KzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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',
		exposes: [e.pressure().withUnit('kPa'),
		    exposes.numeric('bar', ea.STATE).withUnit('bar').withDescription('pressure in bar'),
			exposes.numeric('psi', ea.STATE).withUnit('psi').withDescription('pressure in psi'),
			e.temperature(),
			e.battery_low(),
			e.battery(),
			e.battery_voltage(),
		    exposes.numeric('reading_interval', ea.STATE_SET).withUnit('Seconds').withDescription('Setting the sensor reading interval. Setting the time in seconds, by default 60 seconds')
                .withValueMin(5).withValueMax(360),
			exposes.binary('pool_rate_on', ea.STATE_SET, 'ON', 'OFF').withDescription('Pool rate on off'),
			exposes.binary('config_report_enable', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable reporting based on reporting configuration'),
		    exposes.binary('comparison_previous_data', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable сontrol of comparison with previous data'),
			exposes.numeric('temperature_offset', ea.STATE_SET).withUnit('°C').withValueStep(0.1).withDescription('Adjust temperature')
                .withValueMin(-10.0).withValueMax(10.0),
			exposes.numeric('pressure_offset', ea.STATE_SET).withUnit('kPa').withValueStep(0.1).withDescription('Adjust pressure')
                .withValueMin(-100.0).withValueMax(100.0),
			exposes.numeric('raw_temperature', ea.STATE_GET).withDescription('Sensor temperature'),
			exposes.numeric('uptime', ea.STATE).withUnit('Hours').withDescription('Uptime'),
			exposes.numeric('sensor_identifier', ea.STATE_GET).withDescription('Sensor type, identifier')],
};

module.exports = definition;